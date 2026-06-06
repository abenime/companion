"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const database_1 = require("../config/database");
class AdminController {
    static async getUsers(req, res) {
        const db = database_1.DatabaseConnection.getInstance();
        try {
            // Get all users along with their demographics and subscription status
            const query = `
                SELECT u.id, u.name, u.email,
                       p.work_status as cohort,
                       s.status as subscription_status,
                       u.created_at
                FROM users u
                LEFT JOIN user_profiles p ON p.user_id = u.id
                LEFT JOIN user_subscriptions s ON s.user_id = u.id
            `;
            const result = await db.query(query);
            res.status(200).json({
                total_records: result.rows.length,
                users: result.rows
            });
        }
        catch (error) {
            console.error('Admin Fetch Users error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async purgeUser(req, res) {
        const { id } = req.params;
        const db = database_1.DatabaseConnection.getInstance();
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            // Delete raw signals, daily features, inferences, baselines, profile, connection
            await client.query('DELETE FROM raw_signals WHERE user_id = $1', [id]);
            await client.query('DELETE FROM daily_features WHERE user_id = $1', [id]);
            await client.query('DELETE FROM ai_inferences WHERE user_id = $1', [id]);
            await client.query('DELETE FROM user_baselines WHERE user_id = $1', [id]);
            await client.query('DELETE FROM user_profiles WHERE user_id = $1', [id]);
            await client.query('DELETE FROM user_connections WHERE user_id = $1', [id]);
            await client.query('DELETE FROM user_subscriptions WHERE user_id = $1', [id]);
            await client.query('DELETE FROM users WHERE id = $1', [id]);
            await client.query('COMMIT');
            res.status(200).json({
                success: true,
                message: `Successfully wiped all physical, behavioral, and telemetry records for user ID: ${id}`
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Admin Purge User error:', error);
            res.status(500).json({ error: 'Internal server error during purge' });
        }
        finally {
            client.release();
        }
    }
    static async getSettings(req, res) {
        const db = database_1.DatabaseConnection.getInstance();
        try {
            const result = await db.query('SELECT * FROM system_settings');
            res.status(200).json({ settings: result.rows });
        }
        catch (error) {
            console.error('Admin Fetch Settings error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateSettings(req, res) {
        const { settings } = req.body;
        if (!settings || !Array.isArray(settings)) {
            res.status(400).json({ error: 'Invalid settings list payload' });
            return;
        }
        const db = database_1.DatabaseConnection.getInstance();
        try {
            for (const item of settings) {
                if (item.key && item.value !== undefined) {
                    await db.query('UPDATE system_settings SET value = $2 WHERE key = $1', [item.key, item.value]);
                }
            }
            res.status(200).json({ success: true, updated_records: settings.length });
        }
        catch (error) {
            console.error('Admin Update Settings error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async createPricingPlan(req, res) {
        const { name, slug, price_cents, currency, billing_interval, trial_days } = req.body;
        if (!name || !slug || price_cents === undefined || !currency || !billing_interval) {
            res.status(400).json({ error: 'Missing pricing plan details' });
            return;
        }
        const db = database_1.DatabaseConnection.getInstance();
        try {
            const result = await db.query(`
                INSERT INTO subscription_plans (name, slug, price_cents, currency, billing_interval, trial_days)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [name, slug, price_cents, currency, billing_interval, trial_days ?? 0]);
            res.status(201).json(result.rows[0]);
        }
        catch (error) {
            console.error('Admin Create Pricing Plan error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updatePricingPlan(req, res) {
        const { id } = req.params;
        const { name, price_cents, trial_days } = req.body;
        if (!name || price_cents === undefined || trial_days === undefined) {
            res.status(400).json({ error: 'Missing pricing plan details for update' });
            return;
        }
        const db = database_1.DatabaseConnection.getInstance();
        try {
            const result = await db.query(`
                UPDATE subscription_plans
                SET name = $1, price_cents = $2, trial_days = $3
                WHERE id = $4
                RETURNING *
            `, [name, price_cents, trial_days, id]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Pricing plan not found' });
                return;
            }
            res.status(200).json(result.rows[0]);
        }
        catch (error) {
            console.error('Admin Update Pricing Plan error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async deletePricingPlan(req, res) {
        const { id } = req.params;
        const db = database_1.DatabaseConnection.getInstance();
        try {
            const result = await db.query(`
                DELETE FROM subscription_plans
                WHERE id = $1
            `, [id]);
            if (result.rowCount === 0) {
                res.status(404).json({ error: 'Pricing plan not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Pricing plan deleted successfully.' });
        }
        catch (error) {
            console.error('Admin Delete Pricing Plan error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getPlans(req, res) {
        const db = database_1.DatabaseConnection.getInstance();
        try {
            const result = await db.query('SELECT * FROM subscription_plans');
            res.status(200).json({ plans: result.rows });
        }
        catch (error) {
            console.error('Admin Get Plans error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateUserSubscription(req, res) {
        const { id } = req.params; // User ID
        const { status, plan_slug } = req.body;
        if (!status) {
            res.status(400).json({ error: 'Missing status property' });
            return;
        }
        const db = database_1.DatabaseConnection.getInstance();
        try {
            let planId = null;
            if (plan_slug) {
                const planResult = await db.query('SELECT id FROM subscription_plans WHERE slug = $1', [plan_slug]);
                if (planResult.rows.length > 0) {
                    planId = planResult.rows[0].id;
                }
            }
            // Update user's subscription entry
            await db.query(`
                UPDATE user_subscriptions
                SET plan_id = COALESCE($2, plan_id),
                    status = $3,
                    current_period_end = $4
                WHERE user_id = $1
            `, [id, planId, status, new Date(Date.now() + 30 * 24 * 3600 * 1000)]);
            res.status(200).json({
                success: true,
                message: 'User subscription modified successfully.'
            });
        }
        catch (error) {
            console.error('Admin Update Subscription error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.AdminController = AdminController;
