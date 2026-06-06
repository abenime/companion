package com.wellness.companion.telemetry

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.wellness.companion.MainActivity

class FcmNotificationReceiverService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val context = applicationContext

        // Check if alerts are currently muted
        val prefs = context.getSharedPreferences("wellness_companion_prefs", MODE_PRIVATE)
        val muteUntil = prefs.getLong("mute_until", 0L)
        if (System.currentTimeMillis() < muteUntil) {
            // Notifications are actively muted. Drop telemetry alarm to preserve tranquility.
            return
        }

        // Parse title and recommendation alert body
        val title = remoteMessage.notification?.title ?: "Wellness Protection"
        val body = remoteMessage.notification?.body ?: "Take a brief break to rest your mind."
        val notificationId = System.currentTimeMillis().toInt()

        // Also post to active compose view model if running
        com.wellness.companion.ui.viewmodel.DashboardViewModel.instance?.addNotification(title, body)

        // 1. Primary Action: Clicking notification opens MainActivity
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("wellness_state", remoteMessage.data["wellnessState"])
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        // 2. Interactive Action 1: Start Guided Breath Session directly
        val breathIntent = Intent(this, MainActivity::class.java).apply {
            action = "START_BREATH"
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("action", "START_BREATH")
        }
        val breathPendingIntent = PendingIntent.getActivity(
            this, 1, breathIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 3. Interactive Action 2: Silent Mute alarms for 2 hours
        val muteIntent = Intent(this, NotificationActionReceiver::class.java).apply {
            action = "MUTE_2H"
            putExtra("notification_id", notificationId)
        }
        val mutePendingIntent = PendingIntent.getBroadcast(
            this, 2, muteIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, "TelemetryServiceChannel")
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .addAction(android.R.drawable.ic_media_play, "Start Guided Breath", breathPendingIntent)
            .addAction(android.R.drawable.ic_lock_silent_mode, "Mute for 2h", mutePendingIntent)
            .build()

        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(notificationId, notification)
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
    }
}

class NotificationActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "MUTE_2H") {
            val prefs = context.getSharedPreferences("wellness_companion_prefs", Context.MODE_PRIVATE)
            val muteUntil = System.currentTimeMillis() + (2 * 60 * 60 * 1000) // 2 hours in ms
            prefs.edit().putLong("mute_until", muteUntil).apply()

            // Dismiss the notification
            val notificationId = intent.getIntExtra("notification_id", 0)
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.cancel(notificationId)

            Toast.makeText(context, "Telemetry alerts muted for 2 hours", Toast.LENGTH_SHORT).show()
        }
    }
}
