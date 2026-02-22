import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

export interface MistakeContext {
    question_text: string;
    selected_option: string;
    correct_option: string;
    subject: string;
}

export interface AIInsight {
    reasoning: string;
    misconception: string;
    recommendation: string;
}

/**
 * Helper to sleep for a given duration.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Global queue-like delay to prevent parallel requests hitting the 429 limit instantly.
 */
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 500; // Groq is fast, but let's keep a small gap

/**
 * Analyzes a quiz mistake using Groq (Llama 3.3) with robust retry logic.
 */
export async function analyzeMistake(context: MistakeContext, retryCount = 0): Promise<AIInsight> {
    try {
        // Enforce a sequential gap
        const now = Date.now();
        const timeSinceLast = now - lastRequestTime;
        if (timeSinceLast < MIN_REQUEST_GAP) {
            await sleep(MIN_REQUEST_GAP - timeSinceLast);
        }
        lastRequestTime = Date.now();

        const prompt = `
            Act as an elite MDCAT (Medical College Admission Test) expert tutor.
            Analyze the following mistake made by a student and provide a structured pedagogical insight.

            QUESTION: "${context.question_text}"
            SUBJECT: ${context.subject}
            STUDENT CHOSE: "${context.selected_option}"
            CORRECT ANSWER: "${context.correct_option}"

            Format your response as a valid JSON object with EXACTLY these fields:
            - reasoning: Briefly explain why the student might have chosen the wrong option (e.g., "Student likely confused X with Y because...").
            - misconception: Explain the core scientific or grammatical misconception at play here.
            - recommendation: Provide one specific, high-end advice to avoid this trap in the future.

            Keep it concise, professional, and elite. Output ONLY the JSON.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an elite MDCAT expert tutor. Respond ONLY with valid JSON."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
        });

        const text = chatCompletion.choices[0]?.message?.content || "{}";

        return JSON.parse(text) as AIInsight;
    } catch (error: any) {
        // Handle 429 (Rate Limit) with exponential backoff
        if ((error?.status === 429 || error?.message?.includes("429")) && retryCount < 3) {
            const backoff = Math.pow(2, retryCount) * 2000;
            console.warn(`Groq rate limited. retrying in ${backoff}ms...`);
            await sleep(backoff);
            return analyzeMistake(context, retryCount + 1);
        }

        console.error("Groq Analysis Error:", error);
        return {
            reasoning: "Analysis temporarily optimized for speed.",
            misconception: "Focus on re-evaluating the conceptual differences between the selected and correct options.",
            recommendation: "Review the high-yield chapter fundamentals for this subject."
        };
    }
}
