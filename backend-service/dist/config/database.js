"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const pg_1 = __importDefault(require("pg"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const { Pool } = pg_1.default;
const MOCK_DB_PATH = path_1.default.join(__dirname, '..', '..', 'local_mock_db.json');
class DatabaseConnection {
    static instance = null;
    pool;
    useMock = false;
    mockData = {
        users: [],
        user_profiles: [],
        user_connections: [],
        user_baselines: [],
        daily_features: [],
        ai_inferences: [],
        raw_signals: [],
        subscription_plans: [],
        user_subscriptions: [],
        system_settings: []
    };
    constructor() {
        const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wellness_companion';
        this.pool = new Pool({
            connectionString,
            max: 20,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 1000,
        });
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle database client', err);
        });
        // Check if database is running, if not fallback to Mock Database
        this.checkDatabaseConnection();
    }
    async checkDatabaseConnection() {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            this.useMock = false;
            console.log('Successfully connected to PostgreSQL Relational Database.');
        }
        catch (err) {
            console.warn('⚠️  PostgreSQL connection failed. Operating in high-fidelity local file-based fallback simulation mode.');
            this.useMock = true;
            this.loadMockData();
        }
    }
    loadMockData() {
        try {
            if (fs_1.default.existsSync(MOCK_DB_PATH)) {
                const raw = fs_1.default.readFileSync(MOCK_DB_PATH, 'utf-8');
                this.mockData = JSON.parse(raw);
                // Ensure all keys are initialized
                if (!this.mockData.users)
                    this.mockData.users = [];
                if (!this.mockData.user_profiles)
                    this.mockData.user_profiles = [];
                if (!this.mockData.user_connections)
                    this.mockData.user_connections = [];
                if (!this.mockData.user_baselines)
                    this.mockData.user_baselines = [];
                if (!this.mockData.daily_features)
                    this.mockData.daily_features = [];
                if (!this.mockData.ai_inferences)
                    this.mockData.ai_inferences = [];
                if (!this.mockData.raw_signals)
                    this.mockData.raw_signals = [];
                if (!this.mockData.subscription_plans)
                    this.mockData.subscription_plans = [];
                if (!this.mockData.user_subscriptions)
                    this.mockData.user_subscriptions = [];
                if (!this.mockData.system_settings)
                    this.mockData.system_settings = [];
            }
            this.seedMockData();
            this.saveMockData();
        }
        catch (e) {
            console.error('Failed to load local mock database:', e);
            this.seedMockData();
        }
    }
    saveMockData() {
        try {
            fs_1.default.writeFileSync(MOCK_DB_PATH, JSON.stringify(this.mockData, null, 2), 'utf-8');
        }
        catch (e) {
            console.error('Failed to write local mock database:', e);
        }
    }
    seedMockData() {
        const passwordHash = bcryptjs_1.default.hashSync('securePassword', 10);
        const adminId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
        const janeId = '7ac15bc2-3fe4-4b52-91f8-0051e280fffa';
        if (this.mockData.users.length === 0) {
            this.mockData.users = [
                { id: adminId, name: 'System Admin', email: 'admin@wellness.com', password_hash: passwordHash, created_at: new Date('2026-05-01') },
                { id: janeId, name: 'Jane Doe', email: 'jane@example.com', password_hash: passwordHash, created_at: new Date('2026-05-15') }
            ];
        }
        if (this.mockData.user_profiles.length === 0) {
            this.mockData.user_profiles = [
                { id: 'p1', user_id: adminId, age: 35, gender: 'other', work_status: 'full-time' },
                { id: 'p2', user_id: janeId, age: 28, gender: 'female', work_status: 'full-time' }
            ];
        }
        if (this.mockData.user_connections.length === 0) {
            this.mockData.user_connections = [
                { id: 'c1', user_id: adminId, calendar_sync_enabled: true, external_sync_enabled: true },
                { id: 'c2', user_id: janeId, calendar_sync_enabled: true, external_sync_enabled: false }
            ];
        }
        if (this.mockData.user_baselines.length === 0) {
            this.mockData.user_baselines = [
                { id: 'b1', user_id: adminId, avg_sleep_hours: 8.0, avg_steps: 10000, avg_screen_time_mins: 200, avg_typing_speed_wpm: 50, avg_context_switches_per_hour: 10 },
                { id: 'b2', user_id: janeId, avg_sleep_hours: 8.0, avg_steps: 10000, avg_screen_time_mins: 200, avg_typing_speed_wpm: 50, avg_context_switches_per_hour: 10 }
            ];
        }
        const planFree = 'f0e0d0c0-b0a0-9080-7060-504030201000';
        const planPremium = 'f0e0d0c0-b0a0-9080-7060-504030201001';
        if (this.mockData.subscription_plans.length === 0) {
            this.mockData.subscription_plans = [
                { id: planFree, name: 'Free Standard', slug: 'free', price_cents: 0, currency: 'USD', billing_interval: 'free', trial_days: 0, is_active: true, created_at: new Date('2026-01-01') },
                { id: planPremium, name: 'Premium Monthly', slug: 'premium-monthly', price_cents: 999, currency: 'USD', billing_interval: 'monthly', trial_days: 14, is_active: true, created_at: new Date('2026-01-01') }
            ];
        }
        if (this.mockData.user_subscriptions.length === 0) {
            this.mockData.user_subscriptions = [
                { id: 's1', user_id: adminId, plan_id: planPremium, status: 'active', current_period_start: new Date('2026-06-01'), current_period_end: new Date('2026-07-01'), cancel_at_period_end: false },
                { id: 's2', user_id: janeId, plan_id: planPremium, status: 'trialing', current_period_start: new Date('2026-06-05'), current_period_end: new Date('2026-06-19'), cancel_at_period_end: false }
            ];
        }
        if (this.mockData.system_settings.length === 0) {
            this.mockData.system_settings = [
                { key: 'gemini.system_prompt', value: 'You are a passive wellness companion. Analyze the variance of this user\'s digital signals and deliver micro-interventions focused on rest, stress management, and workplace health.', category: 'gemini', description: 'System instruction prompt for Gemini AI model recommendations.' },
                { key: 'telemetry.desktop.sampling_interval_seconds', value: '60', category: 'telemetry', description: 'Interval at which desktop-agent uploads idle and window metadata.' },
                { key: 'notifications.stress_threshold_percent', value: '85', category: 'notifications', description: 'Stress index score (0-100) above which system triggers stress notifications.' }
            ];
        }
        if (this.mockData.daily_features.length === 0) {
            this.mockData.daily_features = [
                {
                    id: 'df1',
                    user_id: janeId,
                    focus_score: 82,
                    energy_score: 75,
                    stress_score: 30,
                    sleep_deficit_percent: -12.5,
                    screen_time_delta_percent: 15.0,
                    social_app_ratio: 0.25,
                    context_switch_density: 12.0,
                    step_deficit_percent: -10.0,
                    measured_date: new Date('2026-06-05')
                }
            ];
        }
        if (this.mockData.ai_inferences.length === 0) {
            this.mockData.ai_inferences = [
                {
                    id: 'inf1',
                    user_id: janeId,
                    wellness_state: 'optimal',
                    burnout_risk_score: 0.15,
                    explanation: 'Your sleep deficit and work context-switching density are well within normal ranges.',
                    recommendations: JSON.stringify(['Maintain your workstation Pomodoro schedule.', 'Take a 10-minute walk at mid-day.', 'Keep normal evening sleep hours.']),
                    confidence_score: 0.90,
                    inference_date: new Date('2026-06-05')
                }
            ];
        }
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async query(text, params) {
        if (this.useMock) {
            return this.runMockQuery(text, params || []);
        }
        try {
            return await this.pool.query(text, params);
        }
        catch (err) {
            if (err.code === 'ECONNREFUSED' || err.message.includes('connect')) {
                console.warn('PostgreSQL connection lost. Transparently switching to local mock database...');
                this.useMock = true;
                this.loadMockData();
                return this.runMockQuery(text, params || []);
            }
            throw err;
        }
    }
    async getClient() {
        if (this.useMock) {
            const self = this;
            const mockClient = {
                query: async (text, params) => {
                    return self.runMockQuery(text, params || []);
                },
                release: () => { }
            };
            return mockClient;
        }
        try {
            return await this.pool.connect();
        }
        catch (err) {
            console.warn('PostgreSQL connection lost on checkout. Transparently switching to local mock database...');
            this.useMock = true;
            this.loadMockData();
            const self = this;
            const mockClient = {
                query: async (text, params) => {
                    return self.runMockQuery(text, params || []);
                },
                release: () => { }
            };
            return mockClient;
        }
    }
    async close() {
        if (!this.useMock) {
            await this.pool.end();
        }
    }
    runMockQuery(text, params = []) {
        const queryNormalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
        const rows = [];
        // 1. Auth Check if email exists
        if (queryNormalized.includes('select id from users where email')) {
            const email = params[0];
            const found = this.mockData.users.filter((u) => u.email === email);
            return { rows: found, command: 'SELECT', rowCount: found.length, oid: 0, fields: [] };
        }
        // 2. Auth Login Query
        if (queryNormalized.includes('select u.id') && queryNormalized.includes('from users u')) {
            const email = params[0];
            const found = this.mockData.users.find((u) => u.email === email);
            if (found) {
                const profile = this.mockData.user_profiles.find((p) => p.user_id === found.id) || {};
                const connection = this.mockData.user_connections.find((c) => c.user_id === found.id) || {};
                const sub = this.mockData.user_subscriptions.find((s) => s.user_id === found.id) || {};
                const plan = this.mockData.subscription_plans.find((p) => p.id === sub.plan_id) || {};
                rows.push({
                    id: found.id,
                    name: found.name,
                    email: found.email,
                    password_hash: found.password_hash,
                    age: profile.age || 28,
                    gender: profile.gender || 'female',
                    work_status: profile.work_status || 'full-time',
                    calendar_sync_enabled: connection.calendar_sync_enabled || false,
                    external_sync_enabled: connection.external_sync_enabled || false,
                    created_at: found.created_at,
                    subscription_status: sub.status || 'free',
                    subscription_plan: plan.name || 'Free Standard',
                    is_admin: found.email === 'admin@wellness.com' // Map admin user flag!
                });
            }
            return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] };
        }
        // 3. User Register Query
        if (queryNormalized.includes('insert into users')) {
            const name = params[0];
            const email = params[1];
            const password_hash = params[2];
            const newId = 'user-' + Math.random().toString(36).substring(2, 11);
            const newUser = { id: newId, name, email, password_hash, created_at: new Date() };
            this.mockData.users.push(newUser);
            rows.push(newUser);
            // Also auto-subscribe them to Free plan
            const planFree = this.mockData.subscription_plans[0];
            this.mockData.user_subscriptions.push({
                id: 'sub-' + Math.random().toString(36).substring(2, 11),
                user_id: newId,
                plan_id: planFree.id,
                status: 'trialing',
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 14 * 24 * 3600 * 1000),
                cancel_at_period_end: false
            });
            this.saveMockData();
            return { rows, command: 'INSERT', rowCount: rows.length, oid: 0, fields: [] };
        }
        // 4. User Profiles Insert
        if (queryNormalized.includes('insert into user_profiles')) {
            const user_id = params[0];
            const age = params[1];
            const gender = params[2];
            const work_status = params[3];
            const newProfile = { id: 'p-' + Math.random().toString(36).substring(2, 11), user_id, age, gender, work_status };
            this.mockData.user_profiles.push(newProfile);
            rows.push(newProfile);
            this.saveMockData();
            return { rows, command: 'INSERT', rowCount: rows.length, oid: 0, fields: [] };
        }
        // 5. User Connections Insert or Update
        if (queryNormalized.includes('insert into user_connections')) {
            const user_id = params[0];
            const calendar_sync_enabled = params[1];
            const external_sync_enabled = params[2];
            const newConn = { id: 'c-' + Math.random().toString(36).substring(2, 11), user_id, calendar_sync_enabled, external_sync_enabled };
            this.mockData.user_connections.push(newConn);
            rows.push(newConn);
            this.saveMockData();
            return { rows, command: 'INSERT', rowCount: rows.length, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('update user_connections')) {
            const user_id = params[0];
            const conn = this.mockData.user_connections.find((c) => c.user_id === user_id);
            if (conn) {
                if (queryNormalized.includes('calendar_sync_enabled') && params.length > 1) {
                    conn.calendar_sync_enabled = params[1];
                }
                if (queryNormalized.includes('external_sync_enabled') && params.length > 2) {
                    conn.external_sync_enabled = params[2];
                }
                rows.push(conn);
                this.saveMockData();
            }
            return { rows, command: 'UPDATE', rowCount: rows.length, oid: 0, fields: [] };
        }
        // 6. User Baselines Query / Insert
        if (queryNormalized.includes('insert into user_baselines')) {
            const user_id = params[0];
            const newBaseline = { user_id, avg_sleep_hours: 8.0, avg_steps: 10000, avg_screen_time_mins: 200, avg_typing_speed_wpm: 50, avg_context_switches_per_hour: 10 };
            this.mockData.user_baselines.push(newBaseline);
            rows.push(newBaseline);
            this.saveMockData();
            return { rows, command: 'INSERT', rowCount: rows.length, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('select * from user_baselines')) {
            const user_id = params[0];
            const found = this.mockData.user_baselines.find((b) => b.user_id === user_id);
            if (found)
                rows.push(found);
            return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] };
        }
        // 7. Connections Fetch
        if (queryNormalized.includes('select calendar_sync_enabled, external_sync_enabled from user_connections')) {
            const user_id = params[0];
            const conn = this.mockData.user_connections.find((c) => c.user_id === user_id) || { calendar_sync_enabled: false, external_sync_enabled: false };
            rows.push(conn);
            return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] };
        }
        // 8. Daily Features Lookup & Insert
        if (queryNormalized.includes('select * from daily_features')) {
            const user_id = params[0];
            const targetDateStr = params[1] instanceof Date ? params[1].toISOString().split('T')[0] : String(params[1]).split('T')[0];
            const found = this.mockData.daily_features.find((df) => {
                const dfDateStr = df.measured_date instanceof Date ? df.measured_date.toISOString().split('T')[0] : String(df.measured_date).split('T')[0];
                return df.user_id === user_id && dfDateStr === targetDateStr;
            });
            if (found)
                rows.push(found);
            return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('insert into daily_features')) {
            const user_id = params[0];
            const focus_score = params[1];
            const energy_score = params[2];
            const stress_score = params[3];
            const sleep_deficit_percent = params[4];
            const screen_time_delta_percent = params[5];
            const social_app_ratio = params[6];
            const context_switch_density = params[7];
            const step_deficit_percent = params[8];
            const measured_date = params[9];
            const dateStr = measured_date instanceof Date ? measured_date.toISOString().split('T')[0] : String(measured_date).split('T')[0];
            this.mockData.daily_features = this.mockData.daily_features.filter((df) => {
                const dfDateStr = df.measured_date instanceof Date ? df.measured_date.toISOString().split('T')[0] : String(df.measured_date).split('T')[0];
                return !(df.user_id === user_id && dfDateStr === dateStr);
            });
            const newFeature = {
                id: 'df-' + Math.random().toString(36).substring(2, 11),
                user_id, focus_score, energy_score, stress_score,
                sleep_deficit_percent, screen_time_delta_percent,
                social_app_ratio, context_switch_density,
                step_deficit_percent, measured_date
            };
            this.mockData.daily_features.push(newFeature);
            rows.push(newFeature);
            this.saveMockData();
            return { rows, command: 'INSERT', rowCount: rows.length, oid: 0, fields: [] };
        }
        // 9. AI Inferences INSERT & SELECT
        if (queryNormalized.includes('insert into ai_inferences')) {
            const user_id = params[0];
            const wellness_state = params[1];
            const burnout_risk_score = params[2];
            const explanation = params[3];
            const recommendations = params[4];
            const confidence_score = params[5];
            const inference_date = params[6];
            const newInf = {
                id: 'inf-' + Math.random().toString(36).substring(2, 11),
                user_id, wellness_state, burnout_risk_score, explanation, recommendations, confidence_score, inference_date
            };
            this.mockData.ai_inferences.push(newInf);
            rows.push(newInf);
            this.saveMockData();
            return { rows, command: 'INSERT', rowCount: rows.length, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('select') && queryNormalized.includes('from ai_inferences')) {
            const user_id = params[0];
            const found = this.mockData.ai_inferences.filter((inf) => inf.user_id === user_id);
            found.sort((a, b) => new Date(b.inference_date).getTime() - new Date(a.inference_date).getTime());
            return { rows: found, command: 'SELECT', rowCount: found.length, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('delete from subscription_plans')) {
            const id = params[0];
            const beforeCount = this.mockData.subscription_plans.length;
            this.mockData.subscription_plans = this.mockData.subscription_plans.filter((p) => p.id !== id);
            const rowCount = beforeCount - this.mockData.subscription_plans.length;
            this.saveMockData();
            return { rows: [], command: 'DELETE', rowCount, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('delete from raw_signals') || queryNormalized.includes('delete from ai_inferences') || queryNormalized.includes('delete from daily_features')) {
            const user_id = params[0];
            const isToday = queryNormalized.includes('current_date') || queryNormalized.includes('current_date::date');
            if (queryNormalized.includes('raw_signals')) {
                if (isToday) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    this.mockData.raw_signals = this.mockData.raw_signals.filter((s) => {
                        return !(s.user_id === user_id && new Date(s.timestamp).toISOString().split('T')[0] === todayStr);
                    });
                }
                else {
                    this.mockData.raw_signals = this.mockData.raw_signals.filter((s) => s.user_id !== user_id);
                }
            }
            else if (queryNormalized.includes('daily_features')) {
                if (isToday) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    this.mockData.daily_features = this.mockData.daily_features.filter((f) => {
                        return !(f.user_id === user_id && new Date(f.measured_date).toISOString().split('T')[0] === todayStr);
                    });
                }
                else {
                    this.mockData.daily_features = this.mockData.daily_features.filter((f) => f.user_id !== user_id);
                }
            }
            else if (queryNormalized.includes('ai_inferences')) {
                if (isToday) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    this.mockData.ai_inferences = this.mockData.ai_inferences.filter((i) => {
                        return !(i.user_id === user_id && new Date(i.inference_date).toISOString().split('T')[0] === todayStr);
                    });
                }
                else {
                    this.mockData.ai_inferences = this.mockData.ai_inferences.filter((i) => i.user_id !== user_id);
                }
            }
            this.saveMockData();
            return { rows: [], command: 'DELETE', rowCount: 1, oid: 0, fields: [] };
        }
        // 10. Raw signals count or insert
        if (queryNormalized.includes('insert into raw_signals')) {
            const user_id = params[0];
            const source = params[1];
            const signal_type = params[2];
            const numeric_value = params[3];
            const text_value = params[4];
            const timestamp = params[5];
            this.mockData.raw_signals.push({ id: this.mockData.raw_signals.length + 1, user_id, source, signal_type, numeric_value, text_value, timestamp });
            this.saveMockData();
            return { rows: [], command: 'INSERT', rowCount: 1, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('from raw_signals')) {
            const user_id = params[0];
            const found = this.mockData.raw_signals.filter((rs) => rs.user_id === user_id);
            if (found.length === 0) {
                return { rows: [{
                            total_steps: 5000,
                            sleep_duration: 5.0,
                            total_screen_time: 300,
                            total_context_switches: 240,
                            social_time: 120,
                            productivity_time: 40,
                            avg_typing_cadence: 40
                        }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
            }
            return { rows: found, command: 'SELECT', rowCount: found.length, oid: 0, fields: [] };
        }
        // 11. Admin & Dynamic Pricing Custom queries
        if (queryNormalized.includes('from subscription_plans')) {
            const activePlans = this.mockData.subscription_plans.filter((p) => p.is_active);
            return { rows: activePlans, command: 'SELECT', rowCount: activePlans.length, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('insert into subscription_plans')) {
            const name = params[0];
            const slug = params[1];
            const price_cents = params[2];
            const currency = params[3];
            const billing_interval = params[4];
            const trial_days = params[5];
            const newPlan = { id: 'plan-' + Math.random().toString(36).substring(2, 11), name, slug, price_cents, currency, billing_interval, trial_days, is_active: true, created_at: new Date() };
            this.mockData.subscription_plans.push(newPlan);
            rows.push(newPlan);
            this.saveMockData();
            return { rows, command: 'INSERT', rowCount: rows.length, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('from system_settings')) {
            return { rows: this.mockData.system_settings, command: 'SELECT', rowCount: this.mockData.system_settings.length, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('update system_settings')) {
            const key = params[0];
            const value = params[1];
            const setting = this.mockData.system_settings.find((s) => s.key === key);
            if (setting) {
                setting.value = value;
                rows.push(setting);
                this.saveMockData();
            }
            return { rows, command: 'UPDATE', rowCount: rows.length, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('update subscription_plans')) {
            const name = params[0];
            const price_cents = params[1];
            const trial_days = params[2];
            const id = params[3];
            const plan = this.mockData.subscription_plans.find((p) => p.id === id);
            if (plan) {
                if (name !== undefined)
                    plan.name = name;
                if (price_cents !== undefined)
                    plan.price_cents = price_cents;
                if (trial_days !== undefined)
                    plan.trial_days = trial_days;
                rows.push(plan);
                this.saveMockData();
            }
            return { rows, command: 'UPDATE', rowCount: rows.length, oid: 0, fields: [] };
        }
        if (queryNormalized.includes('update user_subscriptions')) {
            const user_id = params[0];
            const sub = this.mockData.user_subscriptions.find((s) => s.user_id === user_id);
            if (sub) {
                if (queryNormalized.includes('plan_id') && params.length > 1)
                    sub.plan_id = params[1];
                if (queryNormalized.includes('status') && params.length > 2)
                    sub.status = params[2];
                if (queryNormalized.includes('current_period_end') && params.length > 3)
                    sub.current_period_end = params[3];
                rows.push(sub);
                this.saveMockData();
            }
            return { rows, command: 'UPDATE', rowCount: rows.length, oid: 0, fields: [] };
        }
        // Generic admin users list simulation
        if (queryNormalized.includes('select u.id, u.name, u.email') && queryNormalized.includes('from users u') && queryNormalized.includes('left join user_profiles')) {
            const allUsersWithDetails = this.mockData.users.map((u) => {
                const profile = this.mockData.user_profiles.find((p) => p.user_id === u.id) || {};
                const sub = this.mockData.user_subscriptions.find((s) => s.user_id === u.id) || {};
                const plan = this.mockData.subscription_plans.find((p) => p.id === sub.plan_id) || { name: 'Free Standard' };
                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    cohort: profile.work_status || 'full-time',
                    subscription_status: sub.status || 'free',
                    subscription_plan: plan.name,
                    signals_last_24h: Math.floor(Math.random() * 150) + 10,
                    last_ingestion_time: new Date().toISOString(),
                    created_at: u.created_at
                };
            });
            return { rows: allUsersWithDetails, command: 'SELECT', rowCount: allUsersWithDetails.length, oid: 0, fields: [] };
        }
        return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] };
    }
}
exports.DatabaseConnection = DatabaseConnection;
