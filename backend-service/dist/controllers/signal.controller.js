"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalController = void 0;
const database_1 = require("../config/database");
class SignalController {
    static async ingestMobile(req, res) {
        const userId = req.userId;
        const { timestamp, screen_time_mins, unlock_count, steps, sleep_hours, app_usage } = req.body;
        if (!timestamp) {
            res.status(400).json({ error: 'Missing timestamp parameter in mobile payload' });
            return;
        }
        const date = new Date(timestamp * 1000);
        const db = database_1.DatabaseConnection.getInstance();
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const insertSignal = `
                INSERT INTO raw_signals (user_id, source, signal_type, numeric_value, timestamp)
                VALUES ($1, 'mobile', $2, $3, $4)
            `;
            // Core Lifestyle Signals
            if (screen_time_mins !== undefined) {
                await client.query(insertSignal, [userId, 'screen_time', screen_time_mins, date]);
            }
            if (unlock_count !== undefined) {
                await client.query(insertSignal, [userId, 'unlock_count', unlock_count, date]);
            }
            if (steps !== undefined) {
                await client.query(insertSignal, [userId, 'steps', steps, date]);
            }
            if (sleep_hours !== undefined) {
                await client.query(insertSignal, [userId, 'sleep', sleep_hours, date]);
            }
            // Categorized App Usages
            if (app_usage && Array.isArray(app_usage)) {
                let socialTime = 0;
                let productivityTime = 0;
                for (const app of app_usage) {
                    const duration = Number(app.duration_seconds) || 0;
                    if (app.category === 'social') {
                        socialTime += duration;
                    }
                    else if (app.category === 'productivity') {
                        productivityTime += duration;
                    }
                }
                if (socialTime > 0) {
                    await client.query(insertSignal, [userId, 'social_app_time', socialTime / 60, date]); // Store as minutes
                }
                if (productivityTime > 0) {
                    await client.query(insertSignal, [userId, 'productivity_app_time', productivityTime / 60, date]); // Store as minutes
                }
            }
            await client.query('COMMIT');
            res.status(201).json({ message: 'Mobile telemetry ingested successfully' });
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Mobile ingestion transaction rolled back with error:', error);
            res.status(500).json({ error: 'Internal server error during mobile ingestion' });
        }
        finally {
            client.release();
        }
    }
    static async ingestDesktop(req, res) {
        const userId = req.userId;
        const { signals } = req.body; // Expects an array or a single object batch
        if (!signals) {
            res.status(400).json({ error: 'Missing signals payload' });
            return;
        }
        const signalList = Array.isArray(signals) ? signals : [signals];
        const db = database_1.DatabaseConnection.getInstance();
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const insertSignal = `
                INSERT INTO raw_signals (user_id, source, signal_type, numeric_value, text_value, timestamp)
                VALUES ($1, 'desktop', $2, $3, $4, $5)
            `;
            for (const item of signalList) {
                const date = new Date(item.timestamp || Date.now());
                if (item.active_app !== undefined) {
                    await client.query(insertSignal, [userId, 'active_app', null, item.active_app, date]);
                }
                if (item.active_window_time_seconds !== undefined) {
                    await client.query(insertSignal, [userId, 'active_window_time', item.active_window_time_seconds, null, date]);
                }
                if (item.context_switches !== undefined) {
                    await client.query(insertSignal, [userId, 'context_switches', item.context_switches, null, date]);
                }
                if (item.keystroke_count !== undefined) {
                    await client.query(insertSignal, [userId, 'keystrokes', item.keystroke_count, null, date]);
                }
                if (item.backspace_count !== undefined) {
                    await client.query(insertSignal, [userId, 'backspaces', item.backspace_count, null, date]);
                }
                if (item.average_cadence_ms !== undefined) {
                    await client.query(insertSignal, [userId, 'typing_cadence', item.average_cadence_ms, null, date]);
                }
                if (item.mouse_movement_score !== undefined) {
                    await client.query(insertSignal, [userId, 'mouse_movement', item.mouse_movement_score, null, date]);
                }
                if (item.mouse_click_count !== undefined) {
                    await client.query(insertSignal, [userId, 'mouse_clicks', item.mouse_click_count, null, date]);
                }
                if (item.idle_time_seconds !== undefined) {
                    await client.query(insertSignal, [userId, 'idle_time', item.idle_time_seconds, null, date]);
                }
            }
            await client.query('COMMIT');
            res.status(201).json({ message: `Successfully ingested ${signalList.length} desktop telemetry batches` });
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Desktop ingestion transaction rolled back with error:', error);
            res.status(500).json({ error: 'Internal server error during desktop ingestion' });
        }
        finally {
            client.release();
        }
    }
}
exports.SignalController = SignalController;
