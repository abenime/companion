package com.wellness.companion.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
interface TelemetryDao {
    @Insert
    suspend fun insertSignal(signal: TelemetryEntity)

    @Query("SELECT * FROM local_telemetry_buffer ORDER BY timestamp ASC LIMIT 100")
    suspend fun getPendingBatch(): List<TelemetryEntity>

    @Query("DELETE FROM local_telemetry_buffer WHERE id IN (:ids)")
    suspend fun clearSyncedBatch(ids: List<Long>)
}
