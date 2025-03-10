import { OpenAI } from 'openai'

// OpenRouter models list
export const OPENROUTER_MODELS = [
    { id: 'qwen/qwq-32b', name: 'Qwen 32B', description: 'High performance multilingual model' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', description: 'Advanced language understanding' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', description: 'High performance multilingual model' },
] as const

// Local AI models
export const LOCAL_AI_MODELS = [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Powerful and fast translation' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'High accuracy, context-aware' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Lightweight and efficient' },
] as const

// Combined models type
export type ModelId = typeof LOCAL_AI_MODELS[number]['id'] | typeof OPENROUTER_MODELS[number]['id']

// OpenRouter client configuration
export const createOpenRouterClient = (apiKey: string) => {
    return new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Story Translation App',
        },
    })
}

// Helper to check if a model is from OpenRouter
export const isOpenRouterModel = (modelId: string): boolean => {
    return OPENROUTER_MODELS.some(model => model.id === modelId)
} 