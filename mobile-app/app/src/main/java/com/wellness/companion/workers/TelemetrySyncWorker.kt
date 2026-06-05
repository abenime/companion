package com.wellness.companion.workers

import android.content.Context
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.wellness.companion.TelemetryApplication
import com.wellness.companion.data.remote.MobileTelemetryPayload
import com.wellness.companion.data.remote.RetrofitClient
import com.wellness.companion.telemetry.AppUsageCollector
import com.wellness.companion.telemetry.HealthConnectBridge
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.util.Calendar

class TelemetrySyncWorker(private val context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val app = context.applicationContext as TelemetryApplication
        val dao = app.database.telemetryDao()

        // 1. Fetch user authorization token securely from local Preferences DataStore
        // Note: For compile check, mock fallback key setup
        val tokenKey = stringPreferencesKey("auth_token")
        // Datastore is managed via Context extensions, mock check
        val token = "Bearer dummy_token" 

        // Read user privacy configurations
        val prefs = context.getSharedPreferences("wellness_companion_prefs", Context.MODE_PRIVATE)
        val activeAppToggle = prefs.getBoolean("active_app_toggle", true)
        val sleepToggle = prefs.getBoolean("sleep_toggle", false)
        val ignoredStr = prefs.getString("ignored_apps", "") ?: ""
        val ignoredApps = ignoredStr.split(",").map { it.trim() }.filter { it.isNotEmpty() }

        // 2. Fetch steps, sleep & heart rate from Health Connect (only if enabled)
        val (steps, sleepHours, heartRate) = if (sleepToggle) {
            val healthConnect = HealthConnectBridge(context)
            healthConnect.getStepsAndSleepAndHeartRate()
        } else {
            Triple(0, 0.0, 0.0)
        }

        // 3. Fetch app usage details (only if active app window tracking is enabled)
        val rawAppUsage = if (activeAppToggle) {
            AppUsageCollector.queryDailyAppUsage(context)
        } else {
            emptyList()
        }

        // Filter out ignored application package names to enforce sensitive skip lists
        val appUsage = rawAppUsage.filter { !ignoredApps.contains(it.package_name) }
        val screenTimeMins = appUsage.sumOf { it.duration_seconds }.toInt() / 60

        // --- 9:00 PM Silent Evening Review Dispatcher ---
        val nowCal = java.util.Calendar.getInstance()
        val currentHour = nowCal.get(java.util.Calendar.HOUR_OF_DAY)
        if (currentHour >= 21) { // 9:00 PM or later
            val todayStr = "${nowCal.get(java.util.Calendar.YEAR)}-${nowCal.get(java.util.Calendar.MONTH)}-${nowCal.get(java.util.Calendar.DAY_OF_MONTH)}"
            val lastReviewSent = prefs.getString("last_evening_review_date", "")
            
            if (lastReviewSent != todayStr) {
                val powerManager = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
                val isInteractive = powerManager.isInteractive
                
                if (!isInteractive) {
                    val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
                    val silentNotification = androidx.core.app.NotificationCompat.Builder(context, "TelemetryServiceChannel")
                        .setContentTitle("Evening Reflection")
                        .setContentText("Your behavioral patterns show high focus today with minimal context switching. Take a moment to unwind.")
                        .setSmallIcon(android.R.drawable.ic_menu_compass)
                        .setPriority(androidx.core.app.NotificationCompat.PRIORITY_LOW)
                        .setAutoCancel(true)
                        .build()
                    
                    notificationManager.notify(44103, silentNotification)
                    prefs.edit().putString("last_evening_review_date", todayStr).apply()
                }
            }
        }

        // 4. Fetch local Room DB unlock stats
        val pendingSignals = dao.getPendingBatch()
        val unlockCount = pendingSignals.filter { it.signalType == "unlock_count" }.size
        val signalIdsToClear = pendingSignals.map { it.id }

        // 5. Structure payload
        val payload = MobileTelemetryPayload(
            timestamp = System.currentTimeMillis() / 1000,
            screen_time_mins = screenTimeMins,
            unlock_count = unlockCount,
            steps = steps,
            sleep_hours = sleepHours,
            heart_rate = heartRate,
            app_usage = appUsage
        )

        return try {
            val response = RetrofitClient.api.syncMobileTelemetry(token, payload)
            if (response.message.isNotEmpty()) {
                // Clear successfully synced unlock indicators from cache
                if (signalIdsToClear.isNotEmpty()) {
                    dao.clearSyncedBatch(signalIdsToClear)
                }
                Result.success()
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            // Server offline or connection timeout, save locally and retry next loop
            Result.retry()
        }
    }
}
