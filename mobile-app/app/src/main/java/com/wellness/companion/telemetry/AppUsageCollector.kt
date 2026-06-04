package com.wellness.companion.telemetry

import android.app.usage.UsageStatsManager
import android.content.Context
import com.wellness.companion.data.remote.AppUsageDto
import java.util.Calendar

object AppUsageCollector {

    fun queryDailyAppUsage(context: Context): List<AppUsageDto> {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        val startTime = calendar.timeInMillis
        val endTime = System.currentTimeMillis()

        val stats = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)
        val appList = mutableListOf<AppUsageDto>()

        for ((packageName, usageStats) in stats) {
            val totalTimeSeconds = usageStats.totalTimeInForeground / 1000
            if (totalTimeSeconds > 0) {
                // Map packages to social vs productivity categories
                val category = when {
                    packageName.contains("tiktok") || packageName.contains("instagram") || packageName.contains("facebook") || packageName.contains("twitter") -> "social"
                    packageName.contains("slack") || packageName.contains("discord") || packageName.contains("whatsapp") -> "social" // Communication counts as social engagement
                    packageName.contains("android.apps.docs") || packageName.contains("sheets") || packageName.contains("code") || packageName.contains("intellij") -> "productivity"
                    else -> "other"
                }
                appList.add(AppUsageDto(packageName, totalTimeSeconds, category))
            }
        }
        return appList
    }
}
