import OpenAI from 'openai';

// Initialize with the key from .env
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';

const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
});

export const hasDeepSeekKey = () => !!apiKey;

export const generateDeepSeekResponse = async (
    prompt: string,
    history: { role: 'user' | 'assistant' | 'system', content: string }[] = [],
    model: 'deepseek' | 'gemini' = 'deepseek'
) => {
    if (!apiKey) throw new Error("VITE_OPENROUTER_API_KEY is missing in .env");

    const modelId = model === 'gemini'
        ? "google/gemini-2.0-flash-exp:free"
        : "deepseek/deepseek-r1";

    // For Gemini, we might want a slightly different system prompt or just keep it consistent for now
    const systemPrompt = model === 'gemini'
        ? "You are Gemini, a fast and capable AI assistant. Be helpful and concise."
        : "You are an advanced AI Tutor. Be helpful, concise, and smart.";

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: prompt }
    ];

    const completion = await client.chat.completions.create({
        model: modelId,
        messages: messages as any,
    });

    return completion.choices[0].message.content || "No response received.";
};

export const generateQuizFromContext = async (content: string, model: 'deepseek' | 'gemini' = 'gemini') => {
    const prompt = `
    Based on the following study notes, generate a 5-question multiple choice quiz.
    Return ONLY a raw JSON array (no markdown formatting).
    Format:
    [
      {
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0 // Index of correct option (0-3)
      }
    ]

    Notes Content:
    ${content.substring(0, 15000)} // Limit context to avoid overflow
  `;

    try {
        const response = await generateDeepSeekResponse(prompt, [], model);
        // Clean response if it contains markdown code blocks
        const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Quiz Generation Failed:", e);
        return [];
    }
};
