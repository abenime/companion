"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureExtractionService = void 0;
const database_1 = require("../config/database");
class FeatureExtractionService {
    static async computeUserDailyFeatures(userId, targetDate) {
        const db = database_1.DatabaseConnection.getInstance();
        // 1. Fetch user baseline profile averages
        const baselineQuery = `SELECT * FROM user_baselines WHERE user_id = $1`;
        const baselineResult = await db.query(baselineQuery, [userId]);
        const baseline = baselineResult.rows[0] || {
            avg_sleep_hours: 7.5,
            avg_steps: 8000,
            avg_screen_time_mins: 240,
            avg_typing_speed_wpm: 60,
            avg_context_switches_per_hour: 15
        };
        // 2. Fetch aggregated telemetry for the target date
        // Signal types: 'steps', 'sleep', 'screen_time', 'context_switches', 'social_app_time', 'productivity_app_time', 'typing_cadence'
        const telemetryQuery = `
            SELECT 
                COALESCE(SUM(CASE WHEN signal_type = 'steps' THEN numeric_value END), 0) as total_steps,
                COALESCE(MAX(CASE WHEN signal_type = 'sleep' THEN numeric_value END), 0) as sleep_duration,
                COALESCE(SUM(CASE WHEN signal_type = 'screen_time' THEN numeric_value END), 0) as total_screen_time,
                COALESCE(SUM(CASE WHEN signal_type = 'context_switches' THEN numeric_value END), 0) as total_context_switches,
                COALESCE(SUM(CASE WHEN signal_type = 'social_app_time' THEN numeric_value END), 0) as social_time,
                COALESCE(SUM(CASE WHEN signal_type = 'productivity_app_time' THEN numeric_value END), 0) as productivity_time,
                COALESCE(AVG(CASE WHEN signal_type = 'typing_cadence' THEN numeric_value END), 0) as avg_typing_cadence
            FROM raw_signals 
            WHERE user_id = $1 AND timestamp::date = $2::date
        `;
        const telemetryResult = await db.query(telemetryQuery, [userId, targetDate]);
        const current = telemetryResult.rows[0];
        // 3. Compute deterministic variances (delta percentages)
        const sleepHours = Number(current.sleep_duration) || baseline.avg_sleep_hours;
        const steps = Number(current.total_steps) || baseline.avg_steps;
        const screenTime = Number(current.total_screen_time) || baseline.avg_screen_time_mins;
        const typingCadence = Number(current.avg_typing_cadence) || baseline.avg_typing_speed_wpm;
        // Ensure baseline non-zero values to avoid division by zero
        const baseSleep = Number(baseline.avg_sleep_hours) || 7.5;
        const baseSteps = Number(baseline.avg_steps) || 8000;
        const baseScreen = Number(baseline.avg_screen_time_mins) || 240;
        const baseTyping = Number(baseline.avg_typing_speed_wpm) || 60;
        const sleepDeficitPercent = ((sleepHours - baseSleep) / baseSleep) * 100;
        const stepDeficitPercent = ((steps - baseSteps) / baseSteps) * 100;
        const screenTimeDeltaPercent = ((screenTime - baseScreen) / baseScreen) * 100;
        const totalWorkTimeHours = 8; // Normal standard denominator
        const contextSwitchDensity = Number(current.total_context_switches) / totalWorkTimeHours;
        const totalAppsTime = Number(current.social_time) + Number(current.productivity_time);
        const socialRatio = totalAppsTime > 0 ? Number(current.social_time) / totalAppsTime : 0.0;
        const keystrokeSpeedDeltaPercent = ((typingCadence - baseTyping) / baseTyping) * 100;
        return {
            sleepDeficitPercent: Number(sleepDeficitPercent.toFixed(2)),
            stepDeficitPercent: Number(stepDeficitPercent.toFixed(2)),
            screenTimeDeltaPercent: Number(screenTimeDeltaPercent.toFixed(2)),
            contextSwitchDensity: Number(contextSwitchDensity.toFixed(2)),
            socialRatio: Number(socialRatio.toFixed(3)),
            keystrokeSpeedDeltaPercent: Number(keystrokeSpeedDeltaPercent.toFixed(2))
        };
    }
    // Periodically recompute averages to establish a rolling 7-day user baseline
    static async recalculateUserBaseline(userId) {
        const db = database_1.DatabaseConnection.getInstance();
        const query = `
            SELECT 
                COALESCE(AVG(steps_sum), 8000) as avg_steps,
                COALESCE(AVG(sleep_max), 7.5) as avg_sleep,
                COALESCE(AVG(screen_sum), 240) as avg_screen_time,
                COALESCE(AVG(cadence_avg), 60) as avg_cadence,
                COALESCE(AVG(switches_sum), 15) as avg_switches
            FROM (
                SELECT timestamp::date,
                    SUM(CASE WHEN signal_type = 'steps' THEN numeric_value END) as steps_sum,
                    MAX(CASE WHEN signal_type = 'sleep' THEN numeric_value END) as sleep_max,
                    SUM(CASE WHEN signal_type = 'screen_time' THEN numeric_value END) as screen_sum,
                    AVG(CASE WHEN signal_type = 'typing_cadence' THEN numeric_value END) as cadence_avg,
                    SUM(CASE WHEN signal_type = 'context_switches' THEN numeric_value END) as switches_sum
                FROM raw_signals
                WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '14 days'
                GROUP BY timestamp::date
            ) as daily_aggregates
        `;
        try {
            const result = await db.query(query, [userId]);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                const updateQuery = `
                    INSERT INTO user_baselines (
                        user_id, avg_sleep_hours, avg_steps, 
                        avg_screen_time_mins, avg_typing_speed_wpm, avg_context_switches_per_hour
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (user_id) DO UPDATE SET
                        avg_sleep_hours = EXCLUDED.avg_sleep_hours,
                        avg_steps = EXCLUDED.avg_steps,
                        avg_screen_time_mins = EXCLUDED.avg_screen_time_mins,
                        avg_typing_speed_wpm = EXCLUDED.avg_typing_speed_wpm,
                        avg_context_switches_per_hour = EXCLUDED.avg_context_switches_per_hour,
                        updated_at = NOW()
                `;
                await db.query(updateQuery, [
                    userId,
                    Number(row.avg_sleep) || 7.5,
                    Math.round(Number(row.avg_steps)) || 8000,
                    Math.round(Number(row.avg_screen_time)) || 240,
                    Math.round(Number(row.avg_cadence)) || 60,
                    Math.round(Number(row.avg_switches)) || 15
                ]);
            }
        }
        catch (error) {
            console.error('Failed to recalculate baseline:', error);
        }
    }
}
exports.FeatureExtractionService = FeatureExtractionService;
