package com.wellness.companion.telemetry

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant

class HealthConnectBridge(private val context: Context) {

    private val healthConnectClient by lazy { 
        try {
            HealthConnectClient.getOrCreate(context)
        } catch (err: Exception) {
            null
        }
    }

    suspend fun getStepsAndSleepAndHeartRate(): Triple<Int, Double, Double> {
        val client = healthConnectClient ?: return Triple(0, 0.0, 0.0)

        val hasPermission = checkPermissions(client)
        if (!hasPermission) return Triple(0, 0.0, 0.0)

        val steps = readSteps(client)
        val sleepHours = readSleep(client)
        val avgHeartRate = readHeartRate(client)

        return Triple(steps, sleepHours, avgHeartRate)
    }

    private suspend fun checkPermissions(client: HealthConnectClient): Boolean {
        val permissions = setOf(
            StepsRecord::class,
            SleepSessionRecord::class,
            HeartRateRecord::class
        )
        val granted = client.permissionController.getGrantedPermissions()
        return granted.containsAll(permissions)
    }

    private suspend fun readSteps(client: HealthConnectClient): Int {
        val startTime = Instant.now().minusSeconds(86400) // Past 24h
        val endTime = Instant.now()
        
        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    StepsRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )
            response.records.sumOf { it.count.toInt() }
        } catch (e: Exception) {
            0
        }
    }

    private suspend fun readSleep(client: HealthConnectClient): Double {
        val startTime = Instant.now().minusSeconds(86400 * 2) // Check past 48h to catch full cycle
        val endTime = Instant.now()
        
        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    SleepSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )
            if (response.records.isEmpty()) return 0.0
            val durationMillis = response.records.sumOf { 
                java.time.Duration.between(it.startTime, it.endTime).toMillis() 
            }
            durationMillis.toDouble() / (1000 * 60 * 60) // Return hours
        } catch (e: Exception) {
            0.0
        }
    }

    private suspend fun readHeartRate(client: HealthConnectClient): Double {
        val startTime = Instant.now().minusSeconds(86400) // Past 24h
        val endTime = Instant.now()
        
        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )
            if (response.records.isEmpty()) return 0.0
            
            var totalBpm = 0.0
            var sampleCount = 0
            for (record in response.records) {
                for (sample in record.samples) {
                    totalBpm += sample.beatsPerMinute
                    sampleCount++
                }
            }
            if (sampleCount > 0) totalBpm / sampleCount else 0.0
        } catch (e: Exception) {
            0.0
        }
    }
}
