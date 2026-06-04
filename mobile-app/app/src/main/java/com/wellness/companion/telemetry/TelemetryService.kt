package com.wellness.companion.telemetry

import android.app.Notification
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.wellness.companion.R
import com.wellness.companion.TelemetryApplication
import com.wellness.companion.data.local.TelemetryEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class TelemetryService : Service() {

    private val job = SupervisorJob()
    private val scope = CoroutineScope(Dispatchers.IO + job)
    
    private val NOTIFICATION_ID = 44102

    private val unlockReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == Intent.ACTION_USER_PRESENT) {
                // Log unlock event passively to local Room DB cache
                scope.launch {
                    val app = application as TelemetryApplication
                    app.database.telemetryDao().insertSignal(
                        TelemetryEntity(
                            source = "mobile",
                            signalType = "unlock_count",
                            numericValue = 1.0,
                            timestamp = System.currentTimeMillis()
                        )
                    )
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        
        // Register receiver for phone screen unlock events
        val filter = IntentFilter(Intent.ACTION_USER_PRESENT)
        registerReceiver(unlockReceiver, filter)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        return START_STICKY
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, "TelemetryServiceChannel")
            .setContentTitle("Wellness Protection Active")
            .setContentText("Passively analyzing lifestyle and focus parameters.")
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(unlockReceiver)
        job.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
