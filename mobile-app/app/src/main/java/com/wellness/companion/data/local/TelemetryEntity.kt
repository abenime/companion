package com.wellness.companion.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "local_telemetry_buffer")
data class TelemetryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val source: String,             // 'mobile' or 'watch'
    val signalType: String,         // 'steps', 'sleep', 'screen_time', etc.
    val numericValue: Double,
    val extraData: String? = null,  // For categorised applications lists
    val timestamp: Long
)
