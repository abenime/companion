# 📱 Mobile Application — Kotlin Android Native Specification

## 1. Codebase Architecture

The Android Native app is designed around Google's recommended **MVVM (Model-View-ViewModel)** architectural pattern. It ensures that UI rendering, local storage, scheduling, and telemetry ingestion operate on distinct, decoupled threads.

```text
       +───────────────────────────────────────+
       │             Android UI                │
       │  (Compose Layouts / Dashboards / Prefs)│
       +──────────────────┬────────────────────+
                          │
       +──────────────────▼────────────────────+
       │             View Models               │
       │   - Controls visual sensor states     │
       │   - Formats user preferences          │
       +──────────────────┬────────────────────+
                          │
       +──────────────────▼────────────────────+
       │             Repository                │
       │  - Coordinates local vs. remote DB    │
       │  - Combines Health Connect & Sensors  │
       +──────┬──────────────────────────┬─────+
              │                          │
              ▼ Local                    ▼ Sync
+──────────────────────────+  +──────────────────────────+
│         Room DB          │  │     Retrofit Client      │
│ - SQLite database cache  │  │ - Async REST API sync    │
│ - Signal buffer tables   │  │ - Safe HTTP client (OkHttp)│
+──────────────────────────+  +──────────────────────────+
```

---

## 2. Telemetry Background Processing (Foreground Service)

To prevent the Android OS from aggressively killing the monitoring engine under high system stress, a **Foreground Service** is implemented. This handles high-frequency events (like unlock frequencies and active sensor processing) while maintaining a low memory profile.

### 2.1 Service Implementation Example

```kotlin
package com.wellness.companion.telemetry

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.wellness.companion.R

class TelemetryService : Service() {

    private val CHANNEL_ID = "TelemetryServiceChannel"
    private val NOTIFICATION_ID = 44102

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)

        // Initialize telemetry routines
        startTelemetryMonitoring()

        return START_STICKY // Service will restart if killed by OS
    }

    private fun startTelemetryMonitoring() {
        // Routine to register sensors (Accelerometer, Unlock Receiver, usage-polling)
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Wellness Protection Active")
            .setContentText("Passively monitoring cognitive wellness indicators.")
            .setSmallIcon(R.drawable.ic_wellness_monitoring)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setCategory(Notification.CATEGORY_SERVICE)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Passive Telemetry Monitoring Channel",
                NotificationManager.IMPORTANCE_MIN
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
```

---

## 3. Passive Telemetry Collectors

### 3.1 Device Interaction Tracking (`UsageStatsManager`)
We query the OS-level usage statistics to compile app session times. We categorise and compress applications into classes (e.g., social apps like TikTok/Instagram vs. productivity apps like Slack/Docs).

```kotlin
import android.app.usage.UsageStatsManager
import android.content.Context
import java.util.Calendar

fun queryAppUsageStats(context: Context): Map<String, Long> {
    val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val calendar = Calendar.getInstance()
    calendar.add(Calendar.DAY_OF_YEAR, -1) // Query last 24h
    val startTime = calendar.timeInMillis
    val endTime = System.currentTimeMillis()

    val stats = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)
    val appDurationMap = mutableMapOf<String, Long>()

    for ((packageName, usageStats) in stats) {
        val totalTime = usageStats.totalTimeInForeground
        if (totalTime > 0) {
            appDurationMap[packageName] = totalTime / 1000 // Convert to seconds
        }
    }
    return appDurationMap
}
```

### 3.2 Wearable Sync Integration (`Health Connect`)
Health Connect is the recommended Google integration pipeline. It acts as a local data broker where smartwatches write metrics, and our application polls this database without opening Bluetooth sockets directly.

```kotlin
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant

class HealthConnectCollector(private val context: Context) {

    private val healthConnectClient by lazy { HealthConnectClient.getOrCreate(context) }

    suspend fun checkAndReadMetrics(): Pair<Int, Double?> {
        val hasPermission = checkPermissions()
        if (!hasPermission) return Pair(0, null)

        val steps = readStepsForYesterday()
        val sleepDurationHours = readSleepSessionYesterday()

        return Pair(steps, sleepDurationHours)
    }

    private suspend fun checkPermissions(): Boolean {
        val permissions = setOf(
            StepsRecord::class,
            SleepSessionRecord::class
        )
        val granted = healthConnectClient.permissionController.getGrantedPermissions()
        return granted.containsAll(permissions)
    }

    private suspend fun readStepsForYesterday(): Int {
        val startTime = Instant.now().minusSeconds(86400)
        val endTime = Instant.now()
        
        val response = healthConnectClient.readRecords(
            ReadRecordsRequest(
                StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
            )
        )
        
        return response.records.sumOf { it.count.toInt() }
    }

    private suspend fun readSleepSessionYesterday(): Double? {
        val startTime = Instant.now().minusSeconds(86400 * 2) // Check past 48h to catch sleep cycles
        val endTime = Instant.now()
        
        val response = healthConnectClient.readRecords(
            ReadRecordsRequest(
                SleepSessionRecord::class,
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
            )
        )
        
        if (response.records.isEmpty()) return null
        val sleepDurationMillis = response.records.sumOf { 
            java.time.Duration.between(it.startTime, it.endTime).toMillis() 
        }
        return sleepDurationMillis.toDouble() / (1000 * 60 * 60) // Return hours
    }
}
```

---

## 4. Offloading Pipeline & WorkManager

To minimize battery drain and gracefully handle offline network states, telemetry events are buffered inside a local SQLite (Room) database. Uploads are batched and scheduled using **WorkManager** to invoke requests when the device is idle, connected to Wi-Fi, or charging.

### 4.1 Room Signal Schema & DAO

```kotlin
import androidx.room.Dao
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query

@Entity(tableName = "local_telemetry_buffer")
data class TelemetryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val source: String,
    val signalType: String,
    val value: Double,
    val extraData: String?,
    val timestamp: Long
)

@Dao
interface TelemetryDao {
    @Insert
    suspend fun insertSignal(signal: TelemetryEntity)

    @Query("SELECT * FROM local_telemetry_buffer ORDER BY timestamp ASC LIMIT 100")
    suspend fun getPendingBatch(): List<TelemetryEntity>

    @Query("DELETE FROM local_telemetry_buffer WHERE id IN (:ids)")
    suspend fun clearSyncedBatch(ids: List<Long>)
}
```

### 4.2 Sync Worker Scheduling

```kotlin
import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class TelemetrySyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        // 1. Fetch Room DB DAO
        // 2. Query pending batch of size 100
        // 3. Trigger HTTP POST via Retrofit client
        // 4. On HTTP 200/201, delete records from SQLite
        // 5. If server unavailable, return Result.retry()
        return Result.success()
    }
}

// Scheduling Configuration
fun schedulePeriodicTelemetrySync(context: Context) {
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .setRequiresBatteryNotLow(true)
        .build()

    val syncRequest = PeriodicWorkRequestBuilder<TelemetrySyncWorker>(30, TimeUnit.MINUTES)
        .setConstraints(constraints)
        .build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        "TelemetrySynchronizer",
        androidx.work.ExistingPeriodicWorkPolicy.KEEP,
        syncRequest
    )
}
```

---

## 5. Permissions Manifest

To gather this deep context on modern Android, the following permissions must be explicitly declared and dynamically requested from the user:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wellness.companion">

    <!-- Foreground service and startup permissions -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    
    <!-- Network access -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Activity recognition -->
    <uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />

    <!-- Health Connect - Sleep & Physical metrics -->
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.health.READ_SLEEP" />
    <uses-permission android:name="android.permission.health.READ_HEART_RATE" />

    <!-- App Usage monitoring (System Level Settings Intent redirection required) -->
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />

</manifest>
```
