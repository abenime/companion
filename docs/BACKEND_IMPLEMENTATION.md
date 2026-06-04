# 🧩 Backend Server — Node.js + Express + TypeScript Specification

## 1. Directory Structure

The backend application is structured as a robust, layered monolithic API designed with strict separation of concerns to allow clean scalability from a hackathon MVP to production scale.

```text
src/
├── config/             # Database, Firebase, and Gemini API setups
├── controllers/        # Express route handlers (parsing inputs, coordinating services)
├── middleware/         # Auth guards (JWT verification), Validation rules, Error handlers
├── models/             # TypeScript interfaces matching database schemas
├── repositories/       # Raw SQL queries or ORM queries (direct data access)
├── routes/             # API routing configurations
├── services/           # CORE LOGIC: Ingestion, Feature Extraction, Gemini AI, Notifications
└── app.ts              # Express initialization & middleware pipeline
```

---

## 2. Ingestion API Contracts & Validation

The API accepts structured telemetry batches from both the Mobile and Desktop clients. It enforces structural integrity using schema validation (such as `express-validator` or `zod`).

### 2.1 Mobile Telemetry Endpoint Schema

* **Route:** `POST /api/v1/signals/mobile`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Payload Structure:**

```json
{
  "timestamp": 1710000000,
  "screen_time_mins": 315,
  "unlock_count": 82,
  "steps": 4350,
  "sleep_hours": 5.4,
  "app_usage": [
    { "package_name": "com.zhiliaoapp.musically", "duration_seconds": 3600, "category": "social" },
    { "package_name": "com.instagram.android", "duration_seconds": 1800, "category": "social" },
    { "package_name": "com.slack", "duration_seconds": 1200, "category": "productivity" }
  ]
}
```

### 2.2 Desktop Telemetry Endpoint Schema

* **Route:** `POST /api/v1/signals/desktop`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Payload Structure:**

```json
{
  "timestamp": 1710000000,
  "active_app": "VSCode",
  "active_window_time_seconds": 5400,
  "context_switches": 38,
  "keystroke_count": 4200,
  "backspace_count": 310,
  "average_cadence_ms": 280.5,
  "mouse_movement_score": 12400,
  "mouse_click_count": 450,
  "idle_time_seconds": 600
}
```

### 2.3 User Signup & Demographics Endpoint Schema

* **Route:** `POST /api/v1/auth/register`
* **Payload Structure:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "profile": {
    "age": 28,
    "gender": "female",
    "work_status": "full-time"
  },
  "connections": {
    "calendar_sync_enabled": false,
    "external_sync_enabled": false
  }
}
```

* **Route:** `PATCH /api/v1/user/connections`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Payload Structure:**

```json
{
  "calendar_sync_enabled": true,
  "external_sync_enabled": true
}
```

---

## 3. Feature Extraction & Baseline Normalization Service

Raw logs are useless for AI. Feeding thousands of database events directly to an LLM is expensive, slow, and noisy. Instead, the backend features a **Deterministic Mathematical Layer** that processes raw signals into **relative baseline deltas** (comparing a user to their own historical sliding averages).

### 3.1 Feature Extraction Code

```typescript
import { DatabaseConnection } from '../config/database';

export interface VarianceFeatures {
    sleepDeficitPercent: number;        // e.g. -25.50 (25.5% less sleep than average)
    screenTimeDeltaPercent: number;     // e.g. +40.00 (40% more screen time than average)
    stepDeficitPercent: number;         // e.g. -50.00 (50% fewer steps than average)
    contextSwitchDensity: number;       // context switches per hour
    socialRatio: number;                // social app time relative to productivity time
    keystrokeSpeedDeltaPercent: number; // speed variance
}

export class FeatureExtractionService {
    
    public static async computeUserDailyFeatures(userId: string, targetDate: Date): Promise<VarianceFeatures> {
        const db = DatabaseConnection.getInstance();

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

        const sleepDeficitPercent = ((sleepHours - baseline.avg_sleep_hours) / baseline.avg_sleep_hours) * 100;
        const stepDeficitPercent = ((steps - baseline.avg_steps) / baseline.avg_steps) * 100;
        const screenTimeDeltaPercent = ((screenTime - baseline.avg_screen_time_mins) / baseline.avg_screen_time_mins) * 100;
        
        const totalWorkTimeHours = 8; // Assumed daily standard denominator
        const contextSwitchDensity = Number(current.total_context_switches) / totalWorkTimeHours;

        const totalAppsTime = Number(current.social_time) + Number(current.productivity_time);
        const socialRatio = totalAppsTime > 0 ? Number(current.social_time) / totalAppsTime : 0.0;
        
        const keystrokeSpeedDeltaPercent = ((typingCadence - baseline.avg_typing_speed_wpm) / baseline.avg_typing_speed_wpm) * 100;

        return {
            sleepDeficitPercent: Number(sleepDeficitPercent.toFixed(2)),
            stepDeficitPercent: Number(stepDeficitPercent.toFixed(2)),
            screenTimeDeltaPercent: Number(screenTimeDeltaPercent.toFixed(2)),
            contextSwitchDensity: Number(contextSwitchDensity.toFixed(2)),
            socialRatio: Number(socialRatio.toFixed(3)),
            keystrokeSpeedDeltaPercent: Number(keystrokeSpeedDeltaPercent.toFixed(2))
        };
    }
}
```

---

## 4. Google Gemini API Integration Harness

Once features are extracted, they are packed into a rigid structural prompt, sent to the Gemini Pro engine via SDK, and validated to match our target relational output schema.

```typescript
import { GoogleGenAI } from '@google/generative-ai';
import { VarianceFeatures } from './FeatureExtractionService';

export interface AIInferenceResult {
    wellnessState: 'optimal' | 'fatigue' | 'burnout_risk' | 'cognitive_overload' | 'social_withdrawal';
    burnoutRiskScore: number; // Float 0.00 to 1.00
    explanation: string;
    recommendations: string[];
    confidence: number;
}

export class GeminiInferenceService {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.ai = new GoogleGenAI({ apiKey });
    }

    public async runInference(features: VarianceFeatures): Promise<AIInferenceResult> {
        const model = this.ai.getGenerativeModel({ 
            model: 'gemini-1.5-pro',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `
            You are an advanced biometric wellness inference engine. 
            Analyze the following passive behavioral delta features representing changes in a user's habits compared to their historical average baseline:

            - Sleep Duration: ${features.sleepDeficitPercent}% (negative means sleep loss)
            - Step count (locomotion activity): ${features.stepDeficitPercent}%
            - Device Screen Time: ${features.screenTimeDeltaPercent}%
            - Desktop app context-switching density (frequent task swapping): ${features.contextSwitchDensity} per hour
            - Social Media vs Productivity ratio: ${features.socialRatio} (higher means more distraction)
            - Typing speed variance: ${features.keystrokeSpeedDeltaPercent}% (negative indicates slower execution)

            Based on these indicators, infer their current psychological wellness state, compute burnout risk probability, explain your reasoning, and generate 3 practical and highly specific coping recommendations.

            Respond STRICTLY with a valid JSON object matching this structure:
            {
                "wellnessState": "optimal" | "fatigue" | "burnout_risk" | "cognitive_overload" | "social_withdrawal",
                "burnoutRiskScore": 0.00 to 1.00,
                "explanation": "clear 2-sentence explanation of why",
                "recommendations": ["coping strategy 1", "coping strategy 2", "coping strategy 3"],
                "confidence": 0.00 to 1.00
            }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        try {
            const parsed: AIInferenceResult = JSON.parse(responseText);
            return parsed;
        } catch (err) {
            console.error("Failed to parse Gemini output, fallback schema invoked.", err);
            return {
                wellnessState: 'fatigue',
                burnoutRiskScore: 0.50,
                explanation: 'Fallback parsing triggered due to API response format mismatch.',
                recommendations: ['Take a brief rest break', 'Limit monitor exposure', 'Stay hydrated'],
                confidence: 0.30
            };
        }
    }
}
```

---

## 5. Firebase Cloud Messaging (FCM) Push Gateway

When the Gemini Inference engine detects an escalating risk state (e.g., `burnout_risk` > 0.70), the recommendation is written to the database and immediately pushes an intervention card to the Android notification drawer.

```typescript
import * as admin from 'firebase-admin';

export class PushNotificationService {
    
    constructor() {
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
        }
    }

    public async sendWellnessIntervention(userFcmToken: string, state: string, recommendation: string) {
        const payload: admin.messaging.Message = {
            token: userFcmToken,
            notification: {
                title: 'Wellness Alert 🧠',
                body: recommendation
            },
            data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                wellnessState: state,
                triggeredAt: Date.now().toString()
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'TelemetryServiceChannel',
                    sound: 'default'
                }
            }
        };

        try {
            const response = await admin.messaging().send(payload);
            console.log(`Successfully dispatched FCM intervention: ${response}`);
        } catch (error) {
            console.error("FCM dispatch failed: ", error);
        }
    }
}
```
