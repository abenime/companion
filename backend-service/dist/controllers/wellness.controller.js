"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WellnessController = void 0;
const database_1 = require("../config/database");
const feature_extractor_service_1 = require("../services/feature-extractor.service");
const gemini_inference_service_1 = require("../services/gemini-inference.service");
const notification_service_1 = require("../services/notification.service");
class WellnessController {
    static async getDailyFeatures(req, res) {
        const userId = req.userId;
        const dateStr = req.query.date;
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        try {
            // Check if features are already extracted and cached for today
            const db = database_1.DatabaseConnection.getInstance();
            const cacheQuery = `SELECT * FROM daily_features WHERE user_id = $1 AND measured_date = $2::date`;
            const cacheResult = await db.query(cacheQuery, [userId, targetDate]);
            if (cacheResult.rows.length > 0) {
                res.status(200).json(cacheResult.rows[0]);
                return;
            }
            // Otherwise, compute them on-the-fly from raw signals
            const features = await feature_extractor_service_1.FeatureExtractionService.computeUserDailyFeatures(userId, targetDate);
            // Compute temporary dummy scores for presentation before AI inference locks them down
            const focusScore = Math.max(0, Math.min(100, Math.round(100 - (features.contextSwitchDensity * 1.5) - (features.screenTimeDeltaPercent > 0 ? features.screenTimeDeltaPercent * 0.2 : 0))));
            const energyScore = Math.max(0, Math.min(100, Math.round(100 + (features.sleepDeficitPercent < 0 ? features.sleepDeficitPercent * 1.2 : 0) + (features.stepDeficitPercent < 0 ? features.stepDeficitPercent * 0.5 : 0))));
            const stressScore = Math.max(0, Math.min(100, Math.round((features.contextSwitchDensity * 2) + (features.sleepDeficitPercent < 0 ? Math.abs(features.sleepDeficitPercent) * 0.8 : 0) + (features.screenTimeDeltaPercent > 0 ? features.screenTimeDeltaPercent * 0.3 : 0))));
            // Save computed features to table to establish persistent trend
            const insertQuery = `
                INSERT INTO daily_features (
                    user_id, focus_score, energy_score, stress_score, 
                    sleep_deficit_percent, screen_time_delta_percent, 
                    social_app_ratio, context_switch_density, 
                    step_deficit_percent, measured_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::date)
                ON CONFLICT (user_id, measured_date) DO UPDATE SET
                    focus_score = EXCLUDED.focus_score,
                    energy_score = EXCLUDED.energy_score,
                    stress_score = EXCLUDED.stress_score,
                    sleep_deficit_percent = EXCLUDED.sleep_deficit_percent,
                    screen_time_delta_percent = EXCLUDED.screen_time_delta_percent,
                    social_app_ratio = EXCLUDED.social_app_ratio,
                    context_switch_density = EXCLUDED.context_switch_density,
                    step_deficit_percent = EXCLUDED.step_deficit_percent
                RETURNING *
            `;
            const insertResult = await db.query(insertQuery, [
                userId, focusScore, energyScore, stressScore,
                features.sleepDeficitPercent, features.screenTimeDeltaPercent,
                features.socialRatio, features.contextSwitchDensity,
                features.stepDeficitPercent, targetDate
            ]);
            res.status(200).json(insertResult.rows[0]);
        }
        catch (error) {
            console.error('Fetch daily features error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async runAIInference(req, res) {
        const userId = req.userId;
        const { fcm_token } = req.body;
        const targetDate = new Date();
        try {
            // 1. Calculate features for the current sliding-window / today
            const features = await feature_extractor_service_1.FeatureExtractionService.computeUserDailyFeatures(userId, targetDate);
            // 2. Invoke Gemini AI Inference Service
            const gemini = new gemini_inference_service_1.GeminiInferenceService();
            const inference = await gemini.runInference(features);
            // 3. Save inference result transactionally to the database
            const db = database_1.DatabaseConnection.getInstance();
            const insertQuery = `
                INSERT INTO ai_inferences (
                    user_id, wellness_state, burnout_risk_score, 
                    explanation, recommendations, confidence_score, inference_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7::date)
                ON CONFLICT DO NOTHING
                RETURNING *
            `;
            const result = await db.query(insertQuery, [
                userId,
                inference.wellnessState,
                inference.burnoutRiskScore,
                inference.explanation,
                JSON.stringify(inference.recommendations),
                inference.confidence,
                targetDate
            ]);
            // 4. If risk profile is high and user provided FCM token, push live notification
            if (inference.burnoutRiskScore > 0.65 && fcm_token) {
                try {
                    const notifier = new notification_service_1.PushNotificationService();
                    const primaryIntervention = inference.recommendations[0] || 'Take a brief break to reset focus.';
                    await notifier.sendWellnessIntervention(fcm_token, inference.wellnessState, primaryIntervention);
                }
                catch (notifyErr) {
                    console.error('FCM trigger failed, bypassed to avoid breaking API call:', notifyErr);
                }
            }
            res.status(200).json({
                message: 'AI inference completed successfully',
                inference: {
                    wellness_state: inference.wellnessState,
                    burnout_risk_score: inference.burnoutRiskScore,
                    explanation: inference.explanation,
                    recommendations: inference.recommendations,
                    confidence: inference.confidence,
                    date: targetDate
                }
            });
        }
        catch (error) {
            console.error('Gemini AI inference execution error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getPredictionsTimeline(req, res) {
        const userId = req.userId;
        const db = database_1.DatabaseConnection.getInstance();
        try {
            // Retrieve last 14 days of inferences to construct timeline
            const query = `
                SELECT inference_date, wellness_state, burnout_risk_score, explanation, recommendations, created_at
                FROM ai_inferences
                WHERE user_id = $1
                ORDER BY inference_date ASC
                LIMIT 14
            `;
            const result = await db.query(query, [userId]);
            res.status(200).json({
                timeline: result.rows.map(row => ({
                    date: row.inference_date,
                    burnout_risk: Number(row.burnout_risk_score),
                    state: row.wellness_state,
                    explanation: row.explanation,
                    recommendations: row.recommendations
                }))
            });
        }
        catch (error) {
            console.error('Fetch predictions timeline error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.WellnessController = WellnessController;
