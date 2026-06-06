# Admin Dashboard — User, Subscription, and Settings Management Specification

## 1. Overview & System Purpose

The **Admin Dashboard** is the centralized control plane for the Passive AI Wellness Companion ecosystem. Designed for administrators, customer support teams, and product managers, it provides real-time observability into user telemetry health, manages monetization structures (subscriptions and custom billing plans), and dynamically overrides runtime system settings (such as Gemini model prompts, ingestion intervals, and notification triggers) without requiring redeployment.

Consistent with the privacy-first architecture of the companion, the Admin Dashboard does not expose raw, un-anonymized keystroke timings or specific app window texts. Instead, it surfaces aggregate telemetry volume, connection status, and diagnostic metrics to protect user trust.

---

## 2. Core Functional Requirements

### 2.1 User Ingestion & Telemetry Observability
* **User Search & Directory:** High-performance searchable directory filtering by email, ID, cohort, demographic group, and subscription tier.
* **Telemetry Health Mapping:** Live charts illustrating raw signal ingestion density over 24-hour periods. Easily identify dead mobile sensors, inactive desktop agents, or broken Google Health Connect synchronization.
* **Data Retention & Privacy Controls:** Trigger on-demand compliance data purges for specific users, audit their data retention duration settings, and view user-consented sharing vectors.

### 2.2 Subscription & Revenue Tracking
* **Subscriber Directory:** Filter users by subscription state: `free`, `trial`, `premium`, or `corporate_enterprise`.
* **Revenue Metrics Pane:** Real-time summary metrics covering Monthly Recurring Revenue (MRR), Average Revenue Per User (ARPU), Customer Acquisition Cost (CAC) trends, and active trial-to-paid conversion rates.
* **Corporate Wellness Accounts:** Enterprise console allowing admin to bind user domains (e.g., `@corporate.com`) to pre-paid group seats and audit overall corporate cohort fatigue levels.

### 2.3 Pricing & Plans Control System
* **Dynamic Plan Modifiers:** UI panels to change pricing models, monthly/annual fees, and grace period boundaries.
* **Trial Period Administration:** Modify standard trial duration globally, or issue customized individual trial extensions for support situations.
* **Coupon & Discount Engine:** Generate, track, and expire discount codes that map directly to payment gateways (e.g., Stripe, PayPal).

### 2.4 System Settings & AI Override Console
* **AI Ingress Tuning:** Live textareas to alter Gemini Pro inference prompts, temperature settings, and cognitive response guidelines instantly.
* **Telemetry Sampling Rate:** Alter desktop/mobile ingestion window sizes globally to optimize PostgreSQL performance during high-traffic intervals.
* **Push Notification Rule Sets:** Edit threshold parameters that dictate when a user's stress score triggers a Firebase (FCM) high-priority notification.

---

## 3. Database Schema Extensions (PostgreSQL)

To support subscription flows, custom billing tiers, and runtime settings, the following relations must be added to the database schema:

```sql
-- 1. Subscription Tiers definitions
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'Free', 'Premium Monthly', 'Enterprise Tier'
    slug VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'free', 'premium-monthly', 'enterprise-tier'
    price_cents INTEGER NOT NULL DEFAULT 0, -- Price in lowest currency denominator
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_interval VARCHAR(20) NOT NULL, -- 'free', 'monthly', 'yearly', 'one-time'
    trial_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Subscription Bindings
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'active', 'trialing', 'past_due', 'canceled', 'unpaid'
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id VARCHAR(255), -- Billing gateway mapping
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- 3. Global Dynamic System & AI Runtime Configurations
CREATE TABLE system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general', -- 'gemini', 'telemetry', 'notifications'
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance tracking
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions (status);
CREATE INDEX idx_user_subscriptions_dates ON user_subscriptions (current_period_end);
```

---

## 4. Admin API Specifications

All administrative endpoints must be exposed under `/api/v1/admin/*` and require both a valid JWT authentication token and an administrative authorization role level check (`isAdmin = true` mapped inside user attributes or a dedicated roles table).

### 4.1 User and Telemetry Monitoring
* **Route:** `GET /api/v1/admin/users`
* **Query Params:** `page=1`, `limit=50`, `query=jane@example.com`, `cohort=full-time`
* **Response payload:**
```json
{
  "total_records": 1240,
  "pages": 25,
  "current_page": 1,
  "users": [
    {
      "id": "7ac15bc2-3fe4-4b52-91f8-0051e280fffa",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "cohort": "full-time",
      "subscription_status": "trialing",
      "signals_last_24h": 450,
      "last_ingestion_time": "2026-06-06T10:15:30Z",
      "created_at": "2026-05-15T08:00:00Z"
    }
  ]
}
```

* **Route:** `DELETE /api/v1/admin/users/:id/purge`
* **Description:** Compliance purge wiping all raw telemetry records and daily feature extractions.
* **Response payload:**
```json
{
  "success": true,
  "message": "Successfully wiped all physical, behavioral, and telemetry records for user ID: 7ac15bc2-3fe4-4b52-91f8-0051e280fffa",
  "purged_records": {
    "raw_signals": 14240,
    "daily_features": 22,
    "ai_inferences": 4
  }
}
```

### 4.2 Subscription & Pricing Controllers
* **Route:** `POST /api/v1/admin/pricing/plans`
* **Payload Structure:**
```json
{
  "name": "Premium Pro Annual",
  "slug": "premium-pro-annual",
  "price_cents": 8900,
  "currency": "USD",
  "billing_interval": "yearly",
  "trial_days": 14
}
```
* **Response payload:**
```json
{
  "id": "e8a3be34-8be0-449a-bd90-ca47bf3122c3",
  "name": "Premium Pro Annual",
  "slug": "premium-pro-annual",
  "price_cents": 8900,
  "currency": "USD",
  "billing_interval": "yearly",
  "trial_days": 14,
  "is_active": true,
  "created_at": "2026-06-06T10:45:00Z"
}
```

* **Route:** `PATCH /api/v1/admin/subscriptions/:id`
* **Description:** Override individual subscription parameters (e.g. support-led extensions).
* **Payload Structure:**
```json
{
  "status": "active",
  "current_period_end": "2026-08-06T00:00:00Z",
  "cancel_at_period_end": false
}
```
* **Response payload:**
```json
{
  "success": true,
  "subscription_id": "3be9fc41-c710-410a-8bf3-5ef21345fef1",
  "new_expiry": "2026-08-06T00:00:00Z",
  "status": "active"
}
```

### 4.3 Runtime Settings Control Panel
* **Route:** `GET /api/v1/admin/settings`
* **Response payload:**
```json
{
  "settings": [
    {
      "key": "gemini.system_prompt",
      "value": "You are a passive wellness companion. Analyze the variance of this user's digital signals and deliver micro-interventions...",
      "category": "gemini"
    },
    {
      "key": "telemetry.desktop.sampling_interval_seconds",
      "value": "60",
      "category": "telemetry"
    },
    {
      "key": "notifications.stress_threshold_percent",
      "value": "85",
      "category": "notifications"
    }
  ]
}
```

* **Route:** `PUT /api/v1/admin/settings`
* **Payload Structure:**
```json
{
  "settings": [
    {
      "key": "telemetry.desktop.sampling_interval_seconds",
      "value": "120"
    },
    {
      "key": "notifications.stress_threshold_percent",
      "value": "90"
    }
  ]
}
```
* **Response payload:**
```json
{
  "success": true,
  "updated_records": 2
}
```

---

## 5. UI/UX Dashboard Concept

The admin dashboard operates on the same styling principles as the web-dashboard: a high-density, minimalist dark-theme workspace (Tailwind background `#1C1C1C`, cards `#2C2C2C`, borders and primary selectors `#8E9F8E`).

```text
+─────────────────────────────────────────────────────────────────────────────────────────+
| [ADMIN CONSOLE]   | Users  | Subscriptions  | Pricing Plans  | System Settings | [LOGOUT] |
+─────────────────────────────────────────────────────────────────────────────────────────+
| OVERVIEW METRICS                                                                        |
| [ Active Users: 1,420 ]   [ Active Subscriptions: 320 ]   [ MRR: $3,200 ]  [ CAC: $14.50]  |
+─────────────────────────────────────────────────────────────────────────────────────────+
| SYSTEM OVERRIDES PANEL                                                                  |
|                                                                                         |
|  Gemini Core Prompt System Instructions                                                 |
|  +───────────────────────────────────────────────────────────────────────────────────+  |
|  | You are a passive wellness companion. Analyze the variance of this user's digital |  |
|  | signals and deliver micro-interventions...                                        |  |
|  +───────────────────────────────────────────────────────────────────────────────────+  |
|                                                                                         |
|  Desktop Sampling Interval: [ 120s  ]      Stress Alert Trigger Threshold: [ 90% ]      |
|                                                                                         |
|                                                                    [ SAVE RUNTIME SYSTEM ] |
+─────────────────────────────────────────────────────────────────────────────────────────+
| USER DIRECTORY & HEALTH OBSERVABILITY                                                   |
|  Search: [ jane@example.com    ]   Cohort: [ All Cohorts   ]   Subscription: [ All    ] |
|                                                                                         |
|  NAME       EMAIL             SUBSCRIBED  COHORT      STATUS      LAST SYNC  ACTIONS        |
|  Jane Doe   jane@example.com  Trial       Full-Time   [HEALTHY]   2m ago     [Edit] [Purge] |
|  John Smith john@company.com  Corporate   Freelancer  [WARNING]   4h ago     [Edit] [Purge] |
|                                                                                         |
+─────────────────────────────────────────────────────────────────────────────────────────+
```
