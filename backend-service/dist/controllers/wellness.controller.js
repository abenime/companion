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
    static async deleteTodayLogs(req, res) {
        const userId = req.userId;
        const db = database_1.DatabaseConnection.getInstance();
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const deleteSignals = `
                DELETE FROM raw_signals 
                WHERE user_id = $1 AND timestamp::date = CURRENT_DATE
            `;
            const signalsRes = await client.query(deleteSignals, [userId]);
            const deleteFeatures = `
                DELETE FROM daily_features 
                WHERE user_id = $1 AND measured_date = CURRENT_DATE
            `;
            await client.query(deleteFeatures, [userId]);
            const deleteInferences = `
                DELETE FROM ai_inferences 
                WHERE user_id = $1 AND inference_date = CURRENT_DATE
            `;
            await client.query(deleteInferences, [userId]);
            await client.query('COMMIT');
            res.status(200).json({
                message: "Today's logs and inferences deleted successfully from database",
                deleted_signals_count: signalsRes.rowCount || 0
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Delete today logs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
        finally {
            client.release();
        }
    }
    static async purgeAllLogs(req, res) {
        const userId = req.userId;
        const db = database_1.DatabaseConnection.getInstance();
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const deleteSignals = `DELETE FROM raw_signals WHERE user_id = $1`;
            const signalsRes = await client.query(deleteSignals, [userId]);
            const deleteFeatures = `DELETE FROM daily_features WHERE user_id = $1`;
            await client.query(deleteFeatures, [userId]);
            const deleteInferences = `DELETE FROM ai_inferences WHERE user_id = $1`;
            await client.query(deleteInferences, [userId]);
            await client.query('COMMIT');
            res.status(200).json({
                message: 'All of your telemetry history and AI analyses have been permanently purged from database',
                deleted_signals_count: signalsRes.rowCount || 0
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Purge all logs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
        finally {
            client.release();
        }
    }
    static async getSubscription(req, res) {
        const userId = req.userId;
        const db = database_1.DatabaseConnection.getInstance();
        try {
            const query = `
                SELECT s.status, s.current_period_end, p.name as plan_name, p.slug as plan_slug, p.price_cents, p.currency
                FROM user_subscriptions s
                JOIN subscription_plans p ON s.plan_id = p.id
                WHERE s.user_id = $1
            `;
            const result = await db.query(query, [userId]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Subscription not found' });
                return;
            }
            res.status(200).json(result.rows[0]);
        }
        catch (error) {
            console.error('Get subscription error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async initializeChapaPayment(req, res) {
        const userId = req.userId;
        const { plan_slug } = req.body; // e.g. "premium-monthly"
        if (!plan_slug) {
            res.status(400).json({ error: 'Missing plan slug' });
            return;
        }
        const db = database_1.DatabaseConnection.getInstance();
        try {
            // 1. Get user details
            const userQuery = 'SELECT name, email FROM users WHERE id = $1';
            const userResult = await db.query(userQuery, [userId]);
            if (userResult.rows.length === 0) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            const user = userResult.rows[0];
            // 2. Get plan details
            const planQuery = 'SELECT id, price_cents, currency FROM subscription_plans WHERE slug = $1';
            const planResult = await db.query(planQuery, [plan_slug]);
            if (planResult.rows.length === 0) {
                res.status(404).json({ error: 'Plan not found' });
                return;
            }
            const plan = planResult.rows[0];
            // 3. Generate unique transaction reference
            const tx_ref = `tx-wellness-${userId.substring(0, 8)}-${Date.now()}`;
            // Chapa Key
            const chapaSecretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-dummykey';
            // Split name
            const nameParts = (user.name || 'Jane Doe').trim().split(/\s+/);
            const first_name = nameParts[0] || 'Jane';
            const last_name = nameParts[1] || 'Doe';
            const amount = (plan.price_cents / 100).toString();
            // 4. Initialize transaction with Chapa
            // Dynamically detect host (e.g. 172.16.156.202:3000 or localhost:3000) or override with BACKEND_URL in env
            const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
            const returnUrl = `${backendUrl}/api/v1/wellness/subscription/chapa/verify/${tx_ref}`;
            const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${chapaSecretKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount,
                    currency: 'ETB',
                    email: user.email,
                    first_name,
                    last_name,
                    tx_ref,
                    return_url: returnUrl,
                    customizations: {
                        title: `Wellness Premium Plan`,
                        description: `Subscription upgrade to Premium`
                    }
                })
            });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                res.status(200).json({
                    checkout_url: data.data.checkout_url,
                    tx_ref
                });
            }
            else {
                console.error('Chapa API Error Details:', data);
                res.status(400).json({
                    error: `Chapa API Error: ${data.message || response.statusText}`,
                    details: data
                });
            }
        }
        catch (error) {
            console.error('Chapa init error:', error);
            res.status(500).json({ error: 'Internal server error initiating payment' });
        }
    }
    static async verifyChapaPayment(req, res) {
        const { tx_ref } = req.params;
        const db = database_1.DatabaseConnection.getInstance();
        try {
            const parts = tx_ref.split('-');
            const userIdPrefix = parts[2];
            if (!userIdPrefix) {
                res.status(400).send('<h1>Invalid Transaction Reference</h1>');
                return;
            }
            const userQuery = "SELECT id FROM users WHERE id::text LIKE $1";
            const userResult = await db.query(userQuery, [`${userIdPrefix}%`]);
            if (userResult.rows.length === 0) {
                res.status(404).send('<h1>User not found for this transaction</h1>');
                return;
            }
            const userId = userResult.rows[0].id;
            let paymentSuccess = false;
            const chapaSecretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-dummykey';
            const verifyRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
                headers: {
                    'Authorization': `Bearer ${chapaSecretKey}`
                }
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.status === 'success') {
                paymentSuccess = true;
            }
            if (paymentSuccess) {
                const planResult = await db.query("SELECT id FROM subscription_plans WHERE slug = 'premium-monthly'");
                if (planResult.rows.length > 0) {
                    const planId = planResult.rows[0].id;
                    // Check existing subscription period end to stack new payment on top
                    const existingSubResult = await db.query("SELECT current_period_end FROM user_subscriptions WHERE user_id = $1", [userId]);
                    let baseDate = Date.now();
                    if (existingSubResult.rows.length > 0) {
                        const existingPeriodEnd = new Date(existingSubResult.rows[0].current_period_end);
                        if (existingPeriodEnd.getTime() > Date.now()) {
                            baseDate = existingPeriodEnd.getTime();
                        }
                    }
                    const nextExpiry = new Date(baseDate + 30 * 24 * 3600 * 1000);
                    await db.query(`
                        INSERT INTO user_subscriptions (user_id, plan_id, status, stripe_subscription_id, current_period_start, current_period_end)
                        VALUES ($1, $2, 'active', $3, CURRENT_TIMESTAMP, $4)
                        ON CONFLICT (user_id) DO UPDATE SET
                            plan_id = EXCLUDED.plan_id,
                            status = EXCLUDED.status,
                            stripe_subscription_id = EXCLUDED.stripe_subscription_id,
                            current_period_start = EXCLUDED.current_period_start,
                            current_period_end = EXCLUDED.current_period_end
                    `, [userId, planId, tx_ref, nextExpiry]);
                }
                res.send(`
                    <html>
                        <head>
                            <title>Payment Successful</title>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #F4F6F4; color: #3B533B; }
                                .card { text-align: center; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 400px; width: 90%; }
                                h1 { font-size: 24px; margin-bottom: 10px; color: #3B533B; }
                                p { font-size: 16px; color: #666; margin-bottom: 24px; line-height: 1.5; }
                                .btn { display: inline-block; background-color: #3B533B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; }
                            </style>
                        </head>
                        <body>
                            <div class="card">
                                <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                                <h1>Upgrade Successful!</h1>
                                <p>Thank you! Your account has been upgraded to Premium Plan successfully. You can now return to the app or reload the page.</p>
                                <a href="javascript:window.close()" class="btn">Close Window</a>
                            </div>
                        </body>
                    </html>
                `);
            }
            else {
                res.send(`
                    <html>
                        <head>
                            <title>Payment Failed</title>
                            <style>
                                body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #FFF0F0; }
                                .card { text-align: center; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
                                h1 { color: #D17E73; }
                            </style>
                        </head>
                        <body>
                            <div class="card">
                                <h1>Payment Verification Failed</h1>
                                <p>We could not verify your transaction. Please try again or contact support.</p>
                            </div>
                        </body>
                    </html>
                `);
            }
        }
        catch (error) {
            console.error('Verify Chapa payment error:', error);
            res.status(500).send('<h1>Internal Server Error during verification</h1>');
        }
    }
}
exports.WellnessController = WellnessController;
