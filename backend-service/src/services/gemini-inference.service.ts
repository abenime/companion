import { GoogleGenerativeAI } from '@google/generative-ai';
import { VarianceFeatures } from './feature-extractor.service';

export interface AIInferenceResult {
    wellnessState: 'optimal' | 'fatigue' | 'burnout_risk' | 'cognitive_overload' | 'social_withdrawal';
    burnoutRiskScore: number; // Float 0.00 to 1.00
    explanation: string;
    recommendations: string[];
    confidence: number;
}

export class GeminiInferenceService {
    private ai: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.ai = new GoogleGenerativeAI(apiKey);
    }

    public async runInference(features: VarianceFeatures): Promise<AIInferenceResult> {
        // Fallback checks for missing API key
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY is not set in environment variables. Invoking heuristic local fallback.');
            return this.runHeuristicInference(features);
        }

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

        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const parsed: AIInferenceResult = JSON.parse(responseText);
            return parsed;
        } catch (err) {
            console.error("Failed to execute or parse Gemini output, fallback heuristic invoked.", err);
            return this.runHeuristicInference(features);
        }
    }

    // High-quality deterministic heuristic for mock testing/demos without billing keys
    private runHeuristicInference(features: VarianceFeatures): AIInferenceResult {
        let wellnessState: 'optimal' | 'fatigue' | 'burnout_risk' | 'cognitive_overload' | 'social_withdrawal' = 'optimal';
        let burnoutRiskScore = 0.10;
        let explanation = 'All biometric signals are aligned within normal baseline parameters.';
        let recommendations = [
            'Maintain your current routine to support focus.',
            'Schedule a hydration break after your next work block.',
            'Keep steps above 8,000 to sustain metabolic energy.'
        ];

        // 1. Burnout Check
        if (features.sleepDeficitPercent < -30 && features.screenTimeDeltaPercent > 40 && features.contextSwitchDensity > 25) {
            wellnessState = 'burnout_risk';
            burnoutRiskScore = 0.85;
            explanation = 'Compounded by a severe sleep deficit and elevated screen time, your fragmented focus patterns show high cumulative burnout indicators.';
            recommendations = [
                'Commit to a complete workstation disconnect for 30 minutes.',
                'Engage in a 10-minute restorative outdoor walk.',
                'Enable system focus filters to block distracting non-work notifications.'
            ];
        }
        // 2. Cognitive Overload Check
        else if (features.contextSwitchDensity > 30) {
            wellnessState = 'cognitive_overload';
            burnoutRiskScore = 0.55;
            explanation = 'Workstation telemetry shows extreme task fragmentation, resulting in high cognitive cost.';
            recommendations = [
                'Shut down all browser tabs and messaging channels not related to your current task.',
                'Commit to a single 25-minute Pomodoro focus session.',
                'Execute a 3-minute diaphragmatic breathing session to calm active heart rate spikes.'
            ];
        }
        // 3. Social Withdrawal Check
        else if (features.stepDeficitPercent < -50 && features.socialRatio > 0.80) {
            wellnessState = 'social_withdrawal';
            burnoutRiskScore = 0.60;
            explanation = 'A massive drop in physical movement paired with high social media exposure indicates low active engagement.';
            recommendations = [
                'Log out of social media apps on your phone for the next 4 hours.',
                'Schedule a quick visual check-in with a colleague or friend.',
                'Go outdoors for a 15-minute sensory walk without headphones.'
            ];
        }
        // 4. Fatigue Check
        else if (features.sleepDeficitPercent < -20 || features.keystrokeSpeedDeltaPercent < -15) {
            wellnessState = 'fatigue';
            burnoutRiskScore = 0.45;
            explanation = 'A sleep shortage combined with motor speed slowing indicates low systemic energy reserves.';
            recommendations = [
                'Increase hydration levels and minimize caffeine consumption after 2 PM.',
                'Aim for sleep 45 minutes earlier tonight than your baseline.',
                'Minimize complex administrative tasks during this energy dip.'
            ];
        }

        return {
            wellnessState,
            burnoutRiskScore,
            explanation,
            recommendations,
            confidence: 0.90
        };
    }
}
