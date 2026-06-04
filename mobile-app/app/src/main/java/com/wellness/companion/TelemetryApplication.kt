package com.wellness.companion

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.wellness.companion.data.local.RoomTelemetryDatabase

class TelemetryApplication : Application() {

    lateinit var database: RoomTelemetryDatabase
        private set

    override fun onCreate() {
        super.onCreate()
        
        // Initialize Room local database cache
        database = RoomTelemetryDatabase.getDatabase(this)

        // Pre-create notification channels for foreground services and AI push interventions
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Wellness Companion Channel"
            val descriptionText = "Notifications and passive interventions from Wellness Companion"
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            
            val channel = NotificationChannel("TelemetryServiceChannel", name, importance).apply {
                description = descriptionText
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}
