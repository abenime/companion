# Project Structure and Tech Stack Specifications

This document outlines the ideal monorepo folder structure for organizing the three distinct codebases (backend, mobile, and desktop), alongside the recommended production-grade dependencies, libraries, and native APIs.

---

## 1. Unified Monorepo Folder Structure

Organizing these projects under a singular repository allows sharing interface models, API contracts, and environment variables during development.

```text
wellness-companion-monorepo/
├── .env.example                # Shared environment templates
├── .gitignore                  # Global git ignores
├── README.md                   # Project overview
│
├── backend-service/            # Node.js + Express + TypeScript API Server
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json            # Dev reloading configuration
│   ├── src/
│   │   ├── app.ts              # Server entry point and middleware pipeline
│   │   ├── config/             # DB and API clients (pg, FCM, Gemini)
│   │   │   ├── db.ts
│   │   │   ├── gemini.ts
│   │   │   └── firebase.ts
│   │   ├── controllers/        # Route logic orchestrators
│   │   │   ├── auth.controller.ts
│   │   │   ├── signal.controller.ts
│   │   │   └── wellness.controller.ts
│   │   ├── middleware/         # Request interceptors
│   │   │   ├── auth.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── models/             # Shared TS interfaces & types
│   │   │   ├── signal.types.ts
│   │   │   └── user.types.ts
│   │   ├── repositories/       # Data Access Object pattern
│   │   │   ├── signal.repository.ts
│   │   │   └── user.repository.ts
│   │   ├── routes/             # Router mappings
│   │   │   ├── auth.routes.ts
│   │   │   ├── signal.routes.ts
│   │   │   └── wellness.routes.ts
│   │   └── services/           # Core Engines (Calculations, AI, Push)
│   │       ├── feature-extractor.service.ts
│   │       ├── gemini-inference.service.ts
│   │       └── notification.service.ts
│   └── tests/                  # Integration and unit tests
│
├── desktop-agent/              # Headless Node.js System Telemetry Agent
│   ├── package.json
│   ├── index.js                # Main event-loop runtime
│   ├── config.js               # Local config (endpoints, polling rate)
│   ├── collectors/             # Input and window hooks
│   │   ├── window-tracker.js   # Active window polling via active-win
│   │   ├── input-telemetry.js  # Cadence/movement trackers via iohook
│   │   └── idle-detector.js    # Idle state poller via desktop-idle
│   └── services/               # Utilities
│       ├── local-db.js         # SQLite or JSON persistence cache
│       └── sync-publisher.js   # HTTPS batch sync manager
│
└── mobile-app/                 # Native Android Kotlin Application
    ├── build.gradle.kts        # Root build configuration
    ├── settings.gradle.kts
    └── app/
        ├── build.gradle.kts    # App modular configurations
        └── src/
            ├── main/
                ├── AndroidManifest.xml
                ├── res/        # Layouts, icons, notification assets
                └── java/com/wellness/companion/
                    ├── TelemetryApplication.kt   # App Context and DI setups
                    ├── data/                     # Local Persistence & Sync
                    │   ├── local/
                    │   │   ├── RoomTelemetryDatabase.kt
                    │   │   ├── TelemetryDao.kt
                    │   │   └── TelemetryEntity.kt
                    │   ├── remote/
                    │   │   ├── RetrofitClient.kt
                    │   │   └── IngestionApi.kt
                    │   └── repository/
                    │       └── TelemetryRepository.kt
                    ├── telemetry/                # Low-level Collectors
                    │   ├── TelemetryService.kt   # Persistent Foreground Service
                    │   ├── AppUsageCollector.kt  # Poller using UsageStatsManager
                    │   └── HealthConnectBridge.kt# Health Connect broker client
                    ├── ui/                       # Dashboard Interface
                    │   ├── MainActivity.kt
                    │   ├── viewmodel/
                    │   │   └── DashboardViewModel.kt
                    │   └── views/
                    │       └── DashboardScreen.kt
                    └── workers/                  # Background Schedulers
                        └── TelemetrySyncWorker.kt # Scheduled upload tasks
```

---

## 2. Technical Stack and Dependencies

The core criteria for selecting these stacks are: high telemetry performance, robust background execution, and rapid development cycles during hackathons.

### 2.1 Backend Server (Node.js + Express + TypeScript)

* **Engine:** Node.js LTS (v20+ recommended)
* **Language:** TypeScript
* **Database:** PostgreSQL (with pg-pool for relational timeseries ingestion)

#### Key Dependencies (`package.json`)

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.11.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-validator": "^7.1.0",
    "firebase-admin": "^12.1.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.5"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.12.12",
    "@types/pg": "^8.11.6",
    "nodemon": "^3.1.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}
```

---

### 2.2 Desktop Telemetry Agent (Node.js head-less service)

* **Engine:** Node.js LTS (v20+ to share engine runtime with server)
* **Language:** CommonJS JavaScript (simplifies rapid local execution of native bindings)

#### Key Dependencies (`package.json`)

```json
{
  "dependencies": {
    "active-win": "^7.1.0",
    "axios": "^1.6.8",
    "desktop-idle": "^1.1.2",
    "iohook": "^0.9.3",
    "nedb": "^1.8.0"
  }
}
```

*Note: `iohook` relies on native multi-platform OS bindings. For correct compilation during build phases, configure target architectural targets in your build configurations.*

---

### 2.3 Mobile App (Android Kotlin Native)

* **IDE/Build Tool:** Android Studio Koala / Gradle Kotlin DSL (`.gradle.kts`)
* **Language:** Kotlin 1.9.20+
* **Target SDK:** API 34 (Android 14)
* **Minimum SDK:** API 26 (Android 8.0 - required for background service limits)

#### Key Dependencies (`build.gradle.kts`)

```kotlin
dependencies {
    // UI Engine
    implementation("androidx.compose.ui:ui:1.6.7")
    implementation("androidx.compose.material3:material3:1.2.1")
    implementation("androidx.activity:activity-compose:1.9.0")
    
    // Asynchronous Execution & Routines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Local Storage (SQLite Room DB)
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")

    // HTTP Communication
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Periodic Background Scheduling
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Google Health Connect (Broker SDK)
    implementation("androidx.health.connect:connect-client:1.1.0-alpha07")

    // Firebase Integration (Authentication & Push Notifications)
    implementation(platform("com.google.firebase:firebase-bom:33.0.0"))
    implementation("com.google.firebase:firebase-messaging-ktx")
}
```

---

## 3. Recommended External Integrations & APIs

These platforms represent the top-performing services for deploying, hosting, and running your MVP services during a hackathon:

| Integration Domain | Recommended Service Provider | Practical Rationale |
| :--- | :--- | :--- |
| **Generative LLM** | Google AI Studio (Gemini-1.5-pro / Gemini-1.5-flash) | Generous free-tier API quotas, rapid response times, and native JSON output format parameters. |
| **Relational Timeseries Database** | Supabase (PostgreSQL hosting) | Cloud hosted PostgreSQL instance provisioned in seconds, with support for standard SQL schemas and integrated real-time WebSocket listeners. |
| **Notification Engine** | Firebase Cloud Messaging (FCM) | The absolute native standard for Android push communications. Integrated directly with Google Play Services to bypass battery optimization blocks. |
| **Hosting & Deployment** | Render or Railway | Extremely fast cloud deployments for Node.js/Express.js apps with direct GitHub integration and automated builds. |
