# 🧠 Passive AI Wellness Companion — Architecture & Design Document

## 1. Project Overview

The **Passive AI Wellness Companion** is an ambitious, multi-device ecosystem designed to monitor and predict individual wellness states passively, without relying on active user mood logging or self-reporting. By collecting continuous behavioral, physical, and environmental telemetry from smartphones, desktop computers, and wearable devices, the system constructs a highly personalized behavioral model.

The core philosophical shift of this project is to move from **reactive mood tracking** (asking a user to click an emoji) to **proactive wellness forecasting** (estimating burnout risk, fatigue levels, and mental focus scores via physical and interaction metadata).

---

## 2. System Architecture

The overall ecosystem is structured around a distributed telemetry network syncing to a centralized, event-driven Node.js backend.

```text
                                  +─────────────────────────+
                                  │   Wearable Smartwatch   │
                                  │   (Heart rate, sleep)   │
                                  +────────────┬────────────+
                                               │
                                               ▼ Bluetooth / Native Sync
+──────────────────────────+      +─────────────────────────+
│   Desktop Agent (Node)   │      │   Android App (Kotlin)  │
│  - Active App Window     │      │   - Screen time & usage │
│  - Idle Duration Tracking│      │   - Sensor telemetry    │
│  - Keystroke Speed Meta  ├─────►│   - Health Connect sync │
+────────────┬─────────────+      +────────────┬────────────+
             │                                 │
             │ HTTPS                           │ HTTPS
             └─────────────────┬───────────────┘
                               │
                               ▼
            +───────────────────────────────────────+
            │          Express.js REST API          │
            │      - Data Ingestion Service         │
            │      - Authentication Gateway         │
            +──────────────────┬────────────────────+
                               │
            +──────────────────▼────────────────────+
            │       Feature Extraction Engine       │
            │   - Normalizes raw metrics            │
            │   - Computes delta variance           │
            +──────────────────┬────────────────────+
                               │
            +──────────────────▼────────────────────+
            │         AI Inference Engine           │
            │   - Bundles contexts for Gemini API   │
            │   - Executes risk forecasts           │
            +──────────────────┬────────────────────+
                               │
                               ├───────────────────────────────────┐
                               ▼                                   ▼
            +───────────────────────────────────────+   +─────────────────────+
            │       PostgreSQL Database DB          │   │  Firebase Messaging │
            │   - TimescaleDB relational signals    │   │  (FCM Push Gateway) │
            +───────────────────────────────────────+   +─────────────────────+
```

---

## 3. Core Architectural Components

### 3.1 Mobile Telemetry (Android Kotlin Native)
Monitors high-level lifestyle signals, background sleep statistics, physical locomotion via step tracking, and screen-state telemetry. It interfaces with Google Health Connect to passively aggregate data written by third-party fitness bands and smartwatches.

### 3.2 Desktop Telemetry (Node.js Background Agent)
Runs as a lightweight tray agent. It collects context-switching frequency, active application window transitions, typing cadence metadata (WPM, deletion patterns), and system-level idle states to measure cognitive workload and work-session lengths.

### 3.3 Node.js & Express Ingestion Backend
An asynchronous, non-blocking ingestion engine optimized to receive streams of sensor events. It handles authentication, structures relational data streams, processes temporal signal baselines, and operates a scheduler that feeds formatted context parameters to the LLM.

### 3.4 AI & Inference Engine (Google Gemini API)
Implements a hybrid rule-and-generative architecture. It uses deterministic mathematical layers to extract variance features (e.g., `-30% sleep variance`) and forwards these structured parameters to Gemini for cognitive inference, risk evaluation, and personalized recommendation generation.

---

## 4. Database Schema (PostgreSQL)

To support timeseries sensor data and state logs efficiently, the database is structured relationally using indexing over dynamic timestamp parameters.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Core Auth and Account Data Only)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Profiles Table (Demographics Metadata)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(50) NOT NULL,
    work_status VARCHAR(100) NOT NULL, -- e.g. 'full-time', 'freelancer', 'student'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- 3. User Connections Table (External App Connection States)
CREATE TABLE user_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    calendar_sync_enabled BOOLEAN DEFAULT FALSE,
    external_sync_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_connection UNIQUE (user_id)
);

-- 4. User Baseline Parameters (stores averages for delta comparison)
CREATE TABLE user_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avg_sleep_hours NUMERIC(4, 2) DEFAULT 7.5,
    avg_steps INTEGER DEFAULT 8000,
    avg_screen_time_mins INTEGER DEFAULT 240,
    avg_typing_speed_wpm INTEGER DEFAULT 60,
    avg_context_switches_per_hour INTEGER DEFAULT 15,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_baseline UNIQUE (user_id)
);

-- 3. Raw Signal Logs (Timeseries Telemetry Ingestion)
CREATE TABLE raw_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'mobile', 'desktop', 'watch'
    signal_type VARCHAR(100) NOT NULL, -- 'steps', 'sleep', 'screen_time', 'active_app', 'typing_speed', 'heart_rate'
    numeric_value NUMERIC(12, 4),
    text_value TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid sliding-window feature extraction
CREATE INDEX idx_raw_signals_user_timestamp ON raw_signals (user_id, timestamp DESC);
CREATE INDEX idx_raw_signals_type_timestamp ON raw_signals (signal_type, timestamp DESC);

-- 4. Extracted Daily Features Table (computed daily/hourly metrics)
CREATE TABLE daily_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    focus_score INTEGER, -- 0-100 range
    energy_score INTEGER, -- 0-100 range
    stress_score INTEGER, -- 0-100 range
    sleep_deficit_percent NUMERIC(5, 2),
    screen_time_delta_percent NUMERIC(5, 2),
    social_app_ratio NUMERIC(4, 3),
    context_switch_density NUMERIC(6, 2),
    step_deficit_percent NUMERIC(5, 2),
    measured_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_date UNIQUE (user_id, measured_date)
);

CREATE INDEX idx_daily_features_lookup ON daily_features (user_id, measured_date DESC);

-- 5. AI Inference and Recommendation Logs
CREATE TABLE ai_inferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    wellness_state VARCHAR(100) NOT NULL, -- 'optimal', 'fatigue', 'burnout_risk', 'cognitive_overload'
    burnout_risk_score NUMERIC(4, 3) NOT NULL, -- 0.000 to 1.000
    explanation TEXT NOT NULL,
    recommendations JSONB NOT NULL, -- Array of strings/objects
    confidence_score NUMERIC(4, 3) NOT NULL,
    inference_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_inferences_lookup ON ai_inferences (user_id, inference_date DESC);
```

---

## 5. Security & Privacy Architecture

Surveillance creep is the largest hurdle for user adoption. The system architecture enforces strict data isolation principles:

1. **Zero Text Capture:** The Desktop agent intercepts keystroke *timings*, *durations*, and *cadences* via global OS polling, but under no circumstance does it bind to the key values themselves.
2. **Local Anonymization:** Raw GPS coordinate storage is bypassed. Spatial data is converted locally to logical distance variance or categorical travel features (e.g., `location_changed: true`) before ingestion.
3. **End-to-End Encryption:** All telemetry streams are packaged in transit using HTTPS (TLS 1.3). Database rows containing personal metadata are secured, and JWT-authenticated channels control resource access.
4. **Data Minimization:** Raw high-frequency signals (such as mouse coordinates or sub-second interval step values) are parsed and aggregated on the client-side or compacted periodically on the server, purging fine-grained timestamps to retain only historical trend baselines.

---

## 6. MVP Development Roadmap

```text
 PHASE 1: Scaffolding (Day 1)
 ├── Initialize Express, TS, PostgreSQL schemas
 ├── Implement JWT Auth & basic user account management
 └── Setup raw endpoint paths for mobile/desktop payloads

 PHASE 2: Mobile & Desktop Collectors (Day 2)
 ├── Implement Kotlin Foreground Service & WorkManager scheduler
 ├── Connect Google Health Connect on Android to read steps/sleep
 └── Write Node.js background loop for active window and idle states

 PHASE 3: Feature Extraction & Baseline Normalization (Day 3)
 ├── Write PostgreSQL aggregate queries to establish 7-day averages
 └── Implement backend services to transform incoming telemetry into variance scores

 PHASE 4: Gemini Core & Proactive Delivery (Day 4)
 ├── Code prompt template compilers in Express AI Service
 ├── Integrate Gemini API with JSON parsing guardrails
 └── Connect FCM to deliver structured notifications to the client device
```
