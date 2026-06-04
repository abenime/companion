# 🧠 AI & Prompt Engineering — Google Gemini Core Specification

The AI Inference Layer bridges the gap between raw numeric behavioral fluctuations and high-level psychological interpretations. For a wellness hackathon, demonstrating **structured, predictable, and explainable AI inferences** is critical for validation and pitching.

---

## 1. System Persona Design

Gemini is configured with a strict, specialized system prompt that restricts conversational fluff and demands analytical rigor.

* **Role:** Passive Behavioral Biometrics Specialist & Clinical Wellness Analyst.
* **Objective:** Synthesize multi-source behavioral delta vectors into standardized wellness scores, evaluate burnout probabilities, and deliver direct, actionable, privacy-respecting coping strategies.
* **Constraints:**
  * Do **not** use speculative medical diagnoses (e.g., do not say "The user has major depressive disorder"). Instead, use functional state assessments (e.g., "The user is displaying patterns consistent with severe cognitive fatigue and screen exhaustion").
  * Do **not** assume external context that is not provided in the parameters.
  * Every recommendation **must** directly address one of the detected variances (e.g., if sleep is poor, recommend a sleep-specific micro-habit).

---

## 2. Gemini Prompt Compilation Template

```text
[SYSTEM INSTRUCTION]
You are a deterministic, state-tracking wellness classifier operating under a JSON payload delivery protocol. You process relative telemetry delta values of an individual user compared against their established 7-day baseline.

[USER METRIC VECTOR]
The following parameters represent percentage deltas (%) and density indices for the past 24-hour cycle:

- Sleep Duration: {{sleepDeficitPercent}}% (Negative values indicate sleep deprivation)
- Locomotion Activity (Step Count): {{stepDeficitPercent}}% (Negative values indicate sedentary behavior)
- Mobile Screen Time: {{screenTimeDeltaPercent}}% (Positive values indicate prolonged screen usage)
- Workstation Context-Switching Density: {{contextSwitchDensity}} events/hour (Index of cognitive fragmentation)
- Distraction Ratio (Social App usage vs. IDE/Document productivity): {{socialRatio}} (Range 0.00 to 1.00)
- Typing Cadence Speed: {{keystrokeSpeedDeltaPercent}}% (Negative values indicate motor slowing, positive indicates rapid burst typing)

[CLASSIFICATION SCHEMA DIRECTIVES]
You must classify the user's primary state into one of the following domains:
1. "optimal": Signals stable. Sleep, activity, and cadence within normal baseline variance (+/- 15%). Focus is sustained.
2. "fatigue": High negative sleep delta coupled with slower motor typing cadence.
3. "burnout_risk": Coexistence of persistent sleep deficits, elevated screen times, and high workspace context-switching density.
4. "cognitive_overload": Context-switching density > 25 events/hour, elevated backspace frequencies, and reduced focus blocks.
5. "social_withdrawal": Extremely low locomotion step count (< -60%), high social media consumption ratios (> 0.85), and low workstation activity.

[RESPONSE PROTOCOL]
Analyze the vectors. Deliver a JSON object containing:
- wellnessState: Categorical string representing the computed state.
- burnoutRiskScore: Floating-point probability between 0.00 (none) and 1.00 (imminent).
- explanation: A concise, highly transparent 2-sentence rationale explicitly citing which deltas caused this classification.
- recommendations: An array of exactly 3 concise, low-friction micro-interventions matching the current state.
- confidence: Your internal mathematical model confidence score (0.00 to 1.00).

Your response must be structural JSON. Do not write markdown blocks before or after the JSON.
```

---

## 3. Strict Schema Guardrails

To prevent JSON formatting failures, the Express backend utilizes a **Structured JSON Response Protocol** by passing a native JSON schema constraint directly to the Gemini API during generation.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AIInferenceResponse",
  "type": "object",
  "properties": {
    "wellnessState": {
      "type": "string",
      "enum": ["optimal", "fatigue", "burnout_risk", "cognitive_overload", "social_withdrawal"]
    },
    "burnoutRiskScore": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0
    },
    "explanation": {
      "type": "string",
      "maxLength": 250
    },
    "recommendations": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "minItems": 3,
      "maxItems": 3
    },
    "confidence": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0
    }
  },
  "required": ["wellnessState", "burnoutRiskScore", "explanation", "recommendations", "confidence"]
}
```

---

## 4. Signal Analysis & Edge Cases

To verify accuracy during manual tests and demos, these three characteristic edge-cases illustrate how combined signals map to high-value AI inferences:

### 4.1 Case A: Impending Burnout (High Risk Scenario)

* **Input Metrics:**
  * Sleep Deficit: `-42.50%`
  * Step Deficit: `-35.00%`
  * Screen Time: `+55.00%`
  * Context Switching Density: `28.4 events/hour`
  * Distraction Ratio: `0.720`
  * Typing Cadence: `-18.40%`
* **Gemini Expected Response JSON:**

```json
{
  "wellnessState": "burnout_risk",
  "burnoutRiskScore": 0.84,
  "explanation": "Compounded by a critical 42.5% sleep deficit and a 55% surge in screen time, the user displays clear motor slowing (-18.4% typing cadence) combined with highly fragmented workplace focus (28.4 switches/hr).",
  "recommendations": [
    "Lock workstation for 15 minutes and step away from all screens.",
    "Go outside for a short, low-intensity walk to offset sedentary load.",
    "Enable Sleep Mode immediately to block late-night mobile push notifications."
  ],
  "confidence": 0.91
}
```

### 4.2 Case B: Cognitive Overload (Focus Fragmentation Scenario)

* **Input Metrics:**
  * Sleep Deficit: `-5.00%`
  * Step Deficit: `+12.00%` (User is moving normally)
  * Screen Time: `+10.00%`
  * Context Switching Density: `41.2 events/hour`
  * Distraction Ratio: `0.350` (Working, but highly fragmented)
  * Typing Cadence: `+22.00%` (Rapid, erratic burst typing)
* **Gemini Expected Response JSON:**

```json
{
  "wellnessState": "cognitive_overload",
  "burnoutRiskScore": 0.45,
  "explanation": "While sleep and locomotion are normal, workstation context-switching is exceptionally high (41.2 swaps/hr), paired with rapid, erratic burst typing, indicating focus fragmentation.",
  "recommendations": [
    "Close all background apps and browser tabs not related to your current task.",
    "Initiate a 25-minute Pomodoro block to re-establish deep work boundaries.",
    "Do a 3-minute physiological sigh breathing exercise to lower acute nervous excitation."
  ],
  "confidence": 0.88
}
```

### 4.3 Case C: Peak Flow State (Optimal Scenario)

* **Input Metrics:**
  * Sleep Deficit: `+4.00%` (Normal sleep)
  * Step Deficit: `-2.00%`
  * Screen Time: `-12.00%`
  * Context Switching Density: `4.5 events/hour` (Highly sustained attention on singular tasks)
  * Distraction Ratio: `0.110` (Almost entirely focused on the IDE app)
  * Typing Cadence: `+1.50%` (Highly steady, rhythmic cadence)
* **Gemini Expected Response JSON:**

```json
{
  "wellnessState": "optimal",
  "burnoutRiskScore": 0.08,
  "explanation": "All lifestyle metrics remain perfectly balanced with the user's baseline. Context-switching is exceptionally low, indicating deep sustained focus and high-efficiency workflow.",
  "recommendations": [
    "Maintain your current workspace configuration; you are in a flow state.",
    "Take a structured hydration break after another 45 minutes of work.",
    "Reflect on this routine to repeat these positive focus cues tomorrow."
  ],
  "confidence": 0.95
}
```
