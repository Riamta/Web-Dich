import { OpenAI } from 'openai'

// OpenRouter models list
export const OPENROUTER_MODELS = [
    { id: 'google/gemma-3-27b-it', name: 'Gemma 3.27B', description: 'High performance multilingual model' },
    { id: 'qwen/qwq-32b', name: 'Qwen 32B', description: 'High performance multilingual model' },
    { id: 'thedrummer/anubis-pro-105b-v1', name: 'Anubis Pro 105B', description: 'High performance multilingual model' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', description: 'Advanced language understanding' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', description: 'High performance multilingual model' }
] as const

// Default model to use first
export const DEFAULT_MODEL = 'qwen/qwq-32b'

// Fallback models in order of preference
export const FALLBACK_MODELS = ['deepseek/deepseek-chat', 'thedrummer/anubis-pro-105b-v1']

// Local AI models
export const LOCAL_AI_MODELS = [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Powerful and fast translation' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: '' },
    { id: 'gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro Exp 03-25', description: '' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Lightweight and efficient' },
] as const

// Combined models type
export type ModelId = typeof LOCAL_AI_MODELS[number]['id'] | typeof OPENROUTER_MODELS[number]['id']

// OpenRouter client configuration
export const createOpenRouterClient = (apiKey: string) => {
    return {
        chat: {
            completions: {
                create: async (params: {
                    model: string;
                    messages: Array<{ role: string; content: string }>;
                }) => {
                    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                            'X-Title': 'Story Translation App',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(params)
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'OpenRouter API error');
                    }

                    const data = await response.json();
                    return data;
                }
            }
        }
    };
}

// Helper to check if a model is from OpenRouter
export const isOpenRouterModel = (modelId: string): boolean => {
    return OPENROUTER_MODELS.some(model => model.id === modelId)
} 