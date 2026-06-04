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

        // 2. Fetch steps & sleep from Health Connect
        val healthConnect = HealthConnectBridge(context)
        val (steps, sleepHours) = healthConnect.getStepsAndSleep()

        // 3. Fetch app usage details (screen time + categorised packages)
        val appUsage = AppUsageCollector.queryDailyAppUsage(context)
        val screenTimeMins = appUsage.sumOf { it.duration_seconds }.toInt() / 60

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
