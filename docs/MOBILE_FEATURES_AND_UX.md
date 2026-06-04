# Mobile Application — User Interface, Features, and UX Specifications

This document defines the comprehensive user experience, design philosophy, interface layouts, and interactive feature set of the Wellness AI Companion mobile application. 

---

## 1. Design Philosophy: Mindful Minimalism

Traditional productivity and health tracking applications often invoke anxiety through aggressive "red rings," notifications about broken streaks, and noisy dashboard feeds. The Wellness AI Companion adopts a **Zero-Guilt, Calming UX** modeled on Nordic minimalist aesthetics.

### 1.1 Visual Identity & Dual-Theme Architecture

The application implements a strict, consistent dual-theme engine (Dark Mode / Light Mode) that ensures maximum readability across different lighting environments without losing the calming aesthetic.

* **Dark Mode Color Palette (Zen Organic):**
  * Primary Background: Dark Slate (#12161A) - strictly dark-theme primary to minimize eye fatigue.
  * Secondary Surface Background: Muted Charcoal (#1C2229).
  * Brand Accent: Sage Green (#8E9F8E) - used to signify optimal balance and recovery.
  * Warm Accent: Sand Ochre (#D9B48F) - used for gentle attention-gathering.
  * Warning Accent: Soft Terracotta (#D17E73) - used sparingly for high-risk warnings.

* **Light Mode Color Palette (Zen Pure):**
  * Primary Background: Soft Alabaster (#F4F6F4) - crisp, bright background for daytime legibility.
  * Secondary Surface Background: Pale Gray-White (#E5EAE5).
  * Brand Accent: Deep Forest Green (#3B533B) - optimized contrast ratio for text and icons.
  * Warm Accent: Warm Amber (#A06F3D) - high-visibility sand color.
  * Warning Accent: Earthy Rust (#AC4335) - balanced contrast alert tone.

* **Global Layout Shell (Consistent Navigation Paradigm):**
  * **Bottom Navigation Bar:** Persistent bottom tab navigation allowing instant routing between:
    * **Home (Wellness Orbit):** High-level view of scores, daily telemetry, and proactive cards.
    * **Analytics (Forecasting Suite):** Comprehensive timeseries graphs and correlation reports.
    * **Settings (Transparency Center):** Granular controls for metrics, account, and external apps.
  * **Side Navigation Drawer:** Accessed via swipe-from-left edge or top-left hamburger menu. It functions as the administrative wrapper:
    * User demographic profile header (showing user age, gender, and work status, backed by the database's separate `user_profiles` table).
    * Global Theme Toggle switch (Dark/Light mode override - stored strictly on-device using Jetpack DataStore, as theme preference is a purely client-side frontend UX state with zero database sync requirements).
    * Account Synchronization status panel (manual DB synchronization triggers).
    * System Connected Calendars fast-glance status indicators.

* **Typography:**
  * Clean, geometric sans-serif fonts (such as Inter or Montserrat) with high vertical spacing to maximize legibility.

* **Micro-Animations (Jetpack Compose):**
  * Dynamic vector translations (gentle pulsing circles mimicking slow, deep breaths).
  * Fluid transition curves (spring physics rather than linear fades) when expanding recommendation detail cards.

---

## 2. Screen-by-Screen User Interface Specifications

The application consists of three primary tab interfaces: the **Wellness Orbit (Home)**, the **Forecasting Suite (Analytics)**, and the **Transparency Center (Settings/Privacy)**.

---

### 2.1 The Wellness Orbit (Primary Home Tab)

The central focus of the homepage is not a grid of numbers, but an abstract, interactive visualization of the user's current systemic state.

```text
+-------------------------------------------------+
|  [Logo] COMPANION                 [Profile Icon]|
|                                                 |
|               THE WELLNESS ORBIT                |
|                     ( (O) )                     |
|                Sage Green Pulsing               |
|            "Your cognitive load is steady"      |
|                                                 |
|  DAILY FORECASTS:                               |
|  +-----------------+  +----------------------+  |
|  | Energy: Optimal |  | Burnout Risk: 12%    |  |
|  +-----------------+  +----------------------+  |
|                                                 |
|  RECOMMENDED ACTION (PROACTIVE CARD):           |
|  +-------------------------------------------+  |
|  | Context-switching is elevated over 45m.   |  |
|  | Take a 60s Breathing Break?               |  |
|  | [Start Now]                   [Dismiss]   |  |
|  +-------------------------------------------+  |
|                                                 |
|  [Home]             [Analytics]     [Settings]  |
+-------------------------------------------------+
```

#### Key Layout Features:
1. **The Orbit Graphic:** A multi-layered, interactive canvas. The outermost ring represents physical movement (from watch/steps), the middle ring represents sleep recovery, and the inner ring represents cognitive focus (from desktop telemetry). 
   * When rings are aligned and healthy, they coalesce into a soft green halo.
   * If a particular parameter drops, its corresponding ring shifts toward Ochre or Terracotta and expands slightly, providing an intuitive, non-numeric warning.
2. **Proactive Intervention Stack:** Located directly below the Orbit, this component displays a single, card-based micro-recommendation computed by the Gemini API. Users interact with simple swipes:
   * **Swipe Left:** Dismisses the recommendation. The local SQLite database logs the dismissal to optimize future suggestion delivery.
   * **Tap [Start Now]:** Directly launches an in-app interactive modal (e.g., opens a 60-second guided breathing overlay with haptic pacing, or starts a guided stretching timer).
3. **Real-Time Telemetry Stream Indicators:** A series of small dot indicators at the bottom of the page showing the connectivity state of background sync pipelines:
   * Dot 1: Health Connect Sync (Active/Disconnected).
   * Dot 2: Desktop Agent Live Sync (Connected/Pending).
   * Dot 3: Local Room DB cache size.

---

### 2.2 Forecasting Suite (Analytics Tab)

This dashboard moves away from flat historical bar charts to focus on **predictive modeling** and **multimodal correlation lists**.

```text
+-------------------------------------------------+
|  FORECASTING SUITE                              |
|                                                 |
|  7-DAY BURNOUT RISK TIMELINE (PREDICTIVE)       |
|  Risk                                           |
|  100% |                                         |
|   50% |            *-----*                      |
|    0% |  *-----*--*                             |
|       +----------------------------------->     |
|         Mon  Tue  Wed  Thu  Fri  Sat  Sun       |
|                                                 |
|  COGNITIVE SIGNAL CORRELATIONS:                 |
|  * Rhythmic Cadence: 12% drop observed during   |
|    continuous active window sessions.           |
|  * Screen Time Offset: High sleep deficit directly|
|    correlates with +45m social app scrolling.   |
|                                                 |
|  [Interactive Diagnostic Chat Button]           |
|                                                 |
|  [Home]             [Analytics]     [Settings]  |
+-------------------------------------------------+
```

#### Key Layout Features:
1. **7-Day Burnout Risk Timeline:** A smooth Bezier line chart displaying historical scores alongside a dotted projection line mapping the next 48-72 hours. This projection is generated by feeding chronological daily features to the Gemini inference engine to flag cumulative exhaustion cycles early.
2. **Behavioral Correlation Feed:** Displays natural-language, explainable correlation insights derived from cross-referencing multi-source signals.
   * *Example:* "Your typing cadence shows an 18% latency increase on days following a sleep deficit greater than 30%. Taking a mid-day break on these days reduces context-switching by 20%."
3. **Interactive Companion Dialogue (Deep-Dive Trigger):** Tapping the Floating Action Button launches a private chat companion interface. Users can ask queries about their behavioral telemetry:
   * *User Query:* "Why was my focus score lower today?"
   * *AI Contextual Response:* "Your desktop telemetry registered 42 context switches per hour between 2 PM and 4 PM, mostly swapping between VS Code and Discord, while your phone reported an increase in notifications. This indicates high workspace fragmentation. I recommend setting a 25-minute quiet block tomorrow."

---

### 2.3 Passive Signal Transparency Center (Settings Tab)

To build trust and resolve privacy concerns, the Transparency Center acts as an explicit, high-control dashboard giving users granular ownership over every byte collected.

```text
+-------------------------------------------------+
|  TRANSPARENCY & PRIVACY CENTER                  |
|                                                 |
|  TELEMETRY COLLECTION CONTROLS:                 |
|                                                 |
|  [Toggle ON]  Keyboard Cadence Metrics          |
|               (Logs only time deltas in ms)     |
|                                                 |
|  [Toggle ON]  Active Application Tracker        |
|               (Ignores specific window titles)   |
|                                                 |
|  [Toggle OFF] Wearable Sleep Synchronization    |
|                                                 |
|  SENSITIVE PATH IGNORE LIST:                    |
|  + Manage Ignored Apps (e.g. Password Managers) |
|                                                 |
|  DATA RETENTION CONTROL:                        |
|  [Delete Today's Logs]  [Purge All Telemetry]   |
|                                                 |
|  [Home]             [Analytics]     [Settings]  |
+-------------------------------------------------+
```

#### Key Layout Features:
1. **Granular Signal Toggles:** Direct visual controls to instantly enable or block telemetry pathways. If a toggle is disabled, the local native collector immediately halts and purges the associated background loop.
2. **Ignored Apps Registry:** Allows users to define specific application package names (on mobile) or executable names (on desktop) that the telemetry agent must skip entirely.
   * *Example:* If a password manager or corporate banking app is active, the agent registers a generic state ("Ignored Workspace") instead of compiling titles or window metadata.
3. **Nuclear Data Deletion:** One-tap triggers to immediately purge local Room database rows, alongside a remote API hook to delete all user timeseries tables from the PostgreSQL server.

---

### 2.4 User Demographics Onboarding & Registration Flow

To build an accurate baseline behavioral model, the system requires a structured, multi-step onboarding wizard at first launch. This ensures the inference model compares metrics to relevant cohorts (e.g., student stress profiles differ significantly from full-time remote developer patterns).

```text
+-------------------------------------------------+
|  CREATE ACCOUNT (STEP 1 OF 3)                   |
|                                                 |
|  Full Name:   [ Jane Doe                      ] |
|  Email:       [ jane@example.com              ] |
|  Password:    [ ************                  ] |
|                                                 |
|  [Next Step]                                    |
+-------------------------------------------------+
|  DEMOGRAPHICS (STEP 2 OF 3)                     |
|                                                 |
|  Age:         [ 28                            ] |
|                                                 |
|  Gender:      ( ) Female  ( ) Male  ( ) Other   |
|                                                 |
|  Work Status:                                   |
|  ( ) Full-time Employed   ( ) Part-time Employed|
|  ( ) Freelancer/Contractor ( ) Student          |
|  ( ) Unemployed           ( ) Retired           |
|                                                 |
|  [Next Step]                                    |
+-------------------------------------------------+
|  INTEGRATIONS (STEP 3 OF 3)                     |
|                                                 |
|  Enable Google Calendar Sync?                   |
|  [Connect Google Calendar]   [Skip for Now]     |
|                                                 |
|  Configure Health Connect?                      |
|  [Authorize Health Connect]   [Skip for Now]     |
|                                                 |
|  [Complete Registration]                        |
+-------------------------------------------------+
```

#### Key Onboarding Features:
1. **Accurate Demographic Profiling:** Data collected (Age, Gender, Work Status) is directly packaged into the baseline registration API. These fields allow the Gemini AI engine to understand the relative cognitive load standard for different user categories (e.g., freelancers have more erratic hours, whereas student metrics spike around exam timelines).
2. **Unified Integration Authorization:** Instead of hidden settings menus, the wizard presents direct Google OAuth triggers for Calendar sync and Health Connect permissions upfront, ensuring transparency from the first touch.

---

### 2.5 Calendar and Productivity App Integrations

Within the Settings tab, users can manage external app hookups to provide scheduling density telemetry (which represents baseline cognitive load constraints).

#### Functional Mechanics:
1. **Google Calendar API Integration (OAuth2):**
   * Authenticates securely via a client-side OAuth flow.
   * Pulls primary calendar events to compute daily density:
     * Total meeting count per day.
     * Overlapping appointment conflicts.
     * Undisturbed focus blocks (empty gaps between events).
2. **Settings Configurations:**
   * **Force Calendar Pull:** Trigger an instant check of calendar parameters.
   * **Ignore Private Calendars:** Switch to filter out personal calendars and read only work-labeled calendars for privacy.

---

## 3. Passive UX: Interactive Notifications

To maintain a calm user experience, push notifications must be **non-obtrusive, hyper-targeted, and immediately actionable**.

### 3.1 Proactive Micro-Interventions (FCM Dispatched)
These notifications are triggered only when cumulative features cross warning thresholds (e.g., Burnout Risk > 70%).

* **Alert Title:** Focus Block Interruption
* **Alert Body:** "You have been switching windows continuously for the last 45 minutes. Step away for a 60-second breathing break?"
* **Action Buttons:**
  * `[Start Guided Breath]` -> Launches an immediate overlay animation over the lockscreen with slow haptic vibrations.
  * `[Mute for 2h]` -> Silences subsequent focus alarms to avoid adding disruption.

### 3.2 Silent Evening Review (Locally Dispatched)
Dispatched once daily at 9:00 PM, but only if the user is inactive on their phone (determined by query of screen-state telemetry).

* **Alert Title:** Evening Reflection
* **Alert Body:** "Your behavioral patterns show high focus today with minimal context switching. Take a moment to unwind."
* **Notification Layout:** Displays a small, muted progress widget inside the notification drawer summarizing daily focus duration, avoiding bright alarms or gamified scores.

---

## 4. Built-In Micro-Interventions: Jetpack Compose Implementations

When users accept an intervention card, the app does not launch a complex, menu-driven interface. It boots into beautiful, full-screen minimalist sessions designed for rapid physical and cognitive resets.

### 4.1 Guided Breathing Module (Pulsing Circle UX)
A serene overlay that guides the user through the physiological sigh (two rapid inhales through the nose, one prolonged exhale through the mouth).

```kotlin
// UI Presentation Logic for Guided Breathing Frame
@Composable
fun BreathingSessionScreen(onSessionComplete: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition()
    
    // Animate scale between 1.0f (Inhale) and 1.6f (Exhale/Hold)
    val scale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.6f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color("#12161A")),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = if (scale > 1.3f) "Exhale slowly..." else "Inhale deeply...",
                style = MaterialTheme.typography.headlineMedium,
                color = Color("#D9B48F")
            )
            
            Spacer(modifier = Modifier.height(64.dev))

            // The soft pulsing meditation ring
            Box(
                modifier = Modifier
                    .size(200.dev)
                    .graphicsLayer(scaleX = scale, scaleY = scale)
                    .background(Color("#8E9F8E"), shape = CircleShape)
                    .alpha(0.4f)
            )

            Spacer(modifier = Modifier.height(64.dev))

            Button(
                onClick = onSessionComplete,
                colors = ButtonDefaults.buttonColors(containerColor = Color("#1C2229"))
            ) {
                Text("Exit Session", color = Color.White)
            }
        }
    }
}
```
