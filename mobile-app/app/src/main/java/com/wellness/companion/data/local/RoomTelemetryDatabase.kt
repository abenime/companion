package com.wellness.companion.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.DatabaseConfiguration
import androidx.room.RoomDatabase

@Database(entities = [TelemetryEntity::class], version = 1, exportSchema = false)
abstract class RoomTelemetryDatabase : RoomDatabase() {

    abstract fun telemetryDao(): TelemetryDao

    companion object {
        @Volatile
        private var INSTANCE: RoomTelemetryDatabase? = null

        fun getDatabase(context: Context): RoomTelemetryDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    RoomTelemetryDatabase::class.java,
                    "telemetry_cache.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
