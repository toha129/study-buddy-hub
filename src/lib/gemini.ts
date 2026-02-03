import { GoogleGenerativeAI } from "@google/generative-ai";

// Store key in localStorage for client-side persistence
const getApiKey = () => localStorage.getItem('sb_gemini_api_key');

// Initialize logic
export const initializeGemini = (apiKey: string) => {
    localStorage.setItem('sb_gemini_api_key', apiKey);
};

export const hasApiKey = () => !!getApiKey();

export const generateAIResponse = async (prompt: string, history: { role: 'user' | 'model', parts: string }[] = []) => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.parts }]
        })),
        generationConfig: {
            maxOutputTokens: 1000,
        },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
};
