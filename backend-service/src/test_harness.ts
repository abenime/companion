import { DatabaseConnection } from './config/database';
import { AuthController } from './controllers/auth.controller';
import { SignalController } from './controllers/signal.controller';
import { WellnessController } from './controllers/wellness.controller';
import { FeatureExtractionService } from './services/feature-extractor.service';
import { GeminiInferenceService } from './services/gemini-inference.service';
import bcrypt from 'bcryptjs';

// Setup Mock Request and Response utilities
function createMockRequest(body: any = {}, query: any = {}, userId?: string): any {
    return {
        body,
        query,
        userId,
        headers: {}
    };
}

function createMockResponse(): any {
    const res: any = {};
    res.statusCode = 200;
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.jsonData = data;
        return res;
    };
    return res;
}

async function runTests() {
    console.log("=================================================");
    console.log("   STARTING BACKEND SERVICE INTEGRATION TESTS    ");
    console.log("=================================================");

    const db = DatabaseConnection.getInstance();

    // Mock query database helper
    db.query = async (text: string, params?: any[]): Promise<any> => {
        const queryNormalized = text.toLowerCase().trim();

        // 1. Auth check if email exists
        if (queryNormalized.includes('select id from users where email')) {
            return { rows: [] }; // No existing user
        }

        // 2. Daily features cache lookup
        if (queryNormalized.includes('select * from daily_features')) {
            return { rows: [] }; // Empty cache to trigger feature extractor service
        }

        // 3. User baseline profile retrieval
        if (queryNormalized.includes('select * from user_baselines')) {
            return { rows: [{
                avg_sleep_hours: 8.0,
                avg_steps: 10000,
                avg_screen_time_mins: 200,
                avg_typing_speed_wpm: 50,
                avg_context_switches_per_hour: 10
            }] };
        }

        // 4. Raw signal aggregation
        if (queryNormalized.includes('select') && queryNormalized.includes('from raw_signals')) {
            return { rows: [{
                total_steps: 5000,          // 50% deficit
                sleep_duration: 5.0,       // 37.5% deficit
                total_screen_time: 300,    // 50% overload
                total_context_switches: 240, // 30 per hour
                social_time: 120,
                productivity_time: 40,
                avg_typing_cadence: 40     // 20% slower
            }] };
        }

        // 5. Daily features insertion
        if (queryNormalized.includes('insert into daily_features')) {
            return { rows: [{ id: 'mock-feature-id', focus_score: 45, energy_score: 50, stress_score: 75 }] };
        }

        // 6. Timeline list
        if (queryNormalized.includes('select') && queryNormalized.includes('from ai_inferences')) {
            return { rows: [
                { inference_date: new Date(), wellness_state: 'fatigue', burnout_risk_score: 0.50, explanation: 'Mild sleep loss.', recommendations: '["Rest"]' }
            ]};
        }

        return { rows: [] };
    };

    // Mock direct client checkout helper for transactions
    db.getClient = async (): Promise<any> => {
        return {
            query: async (text: string, params?: any[]): Promise<any> => {
                const queryNormalized = text.toLowerCase().trim();
                if (queryNormalized.includes('select id from users where email')) {
                    return { rows: [] };
                }
                if (queryNormalized.includes('insert into users')) {
                    return { rows: [{ id: 'mock-user-uuid', name: 'Jane Doe', email: 'jane@example.com' }] };
                }
                return { rows: [] };
            },
            release: () => {}
        };
    };

    let passCount = 0;
    let failCount = 0;

    function assert(condition: boolean, testName: string) {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passCount++;
        } else {
            console.error(`[FAIL] ${testName}`);
            failCount++;
        }
    }

    try {
        // Test Unit 1: User Registration Routing
        console.log("\n[TEST UNIT 1] User Registration Flow...");
        const regReq = createMockRequest({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'securePassword',
            profile: { age: 28, gender: 'female', work_status: 'full-time' },
            connections: { calendar_sync_enabled: true }
        });
        const regRes = createMockResponse();
        await AuthController.register(regReq, regRes);
        assert(regRes.statusCode === 201, 'AuthController.register responds with HTTP 201');
        assert(regRes.jsonData?.token !== undefined, 'AuthController.register produces authorization token');
        assert(regRes.jsonData?.user?.id === 'mock-user-uuid', 'AuthController.register maps separate user ID');

        // Test Unit 2: Passive Ingestion of Mobile Signals
        console.log("\n[TEST UNIT 2] Mobile Signal Ingestion...");
        const mobReq = createMockRequest({
            timestamp: Math.round(Date.now() / 1000),
            screen_time_mins: 120,
            steps: 4000,
            sleep_hours: 7.2,
            app_usage: [{ package_name: 'com.tiktok', duration_seconds: 1800, category: 'social' }]
        }, {}, 'mock-user-uuid');
        const mobRes = createMockResponse();
        await SignalController.ingestMobile(mobReq, mobRes);
        assert(mobRes.statusCode === 201, 'SignalController.ingestMobile responds with HTTP 201');

        // Test Unit 3: Deterministic Feature Extraction Service
        console.log("\n[TEST UNIT 3] Deterministic Feature Extraction Mathematics...");
        const features = await FeatureExtractionService.computeUserDailyFeatures('mock-user-uuid', new Date());
        assert(features.sleepDeficitPercent === -37.50, 'Correctly computes sleep deficit percentage (-37.5%)');
        assert(features.stepDeficitPercent === -50.00, 'Correctly computes step deficit percentage (-50%)');
        assert(features.screenTimeDeltaPercent === 50.00, 'Correctly computes screen time overload delta (+50%)');
        assert(features.contextSwitchDensity === 30.00, 'Correctly computes context switching density per hour');
        assert(features.socialRatio === 0.750, 'Correctly computes social vs productivity ratio (0.75)');

        // Test Unit 4: Core Score Aggregation (WellnessController)
        console.log("\n[TEST UNIT 4] Scoring calculation and persistence caching...");
        const scoreReq = createMockRequest({}, { date: '2026-06-05' }, 'mock-user-uuid');
        const scoreRes = createMockResponse();
        await WellnessController.getDailyFeatures(scoreReq, scoreRes);
        assert(scoreRes.statusCode === 200, 'WellnessController.getDailyFeatures responds with HTTP 200');
        assert(scoreRes.jsonData?.focus_score !== undefined, 'WellnessController returns valid focus score');
        assert(scoreRes.jsonData?.energy_score !== undefined, 'WellnessController returns valid energy score');

        // Test Unit 5: Gemini AI Inference Engine Execution
        console.log("\n[TEST UNIT 5] Gemini AI Inference & Heuristics...");
        const gemini = new GeminiInferenceService();
        const inference = await gemini.runInference(features);
        console.log("Inference result:", JSON.stringify(inference, null, 2));
        assert(inference.wellnessState === 'burnout_risk', 'Heuristics identify high risk state "burnout_risk"');
        assert(inference.burnoutRiskScore === 0.85, 'Heuristics identify 85% risk of burnout');
        assert(inference.recommendations.length === 3, 'Inference returns exactly 3 micro-interventions');

        console.log("\n-------------------------------------------------");
        console.log(`TEST EXECUTION SUMMARY: ${passCount} PASSED, ${failCount} FAILED.`);
        console.log("=================================================");
        process.exit(failCount === 0 ? 0 : 1);

    } catch (err) {
        console.error("Test Harness unhandled execution crash: ", err);
        process.exit(1);
    }
}

runTests();
