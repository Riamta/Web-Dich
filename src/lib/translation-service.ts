import { createOpenRouterClient, isOpenRouterModel } from './api-config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

interface TranslationRequest {
  text: string
  targetLanguage: string
  preserveContext: boolean
  model: string
}

export async function translateText({ text, targetLanguage, preserveContext, model }: TranslationRequest): Promise<string> {
  console.log('🔍 Translation Request:', {
    modelId: model,
    isOpenRouter: isOpenRouterModel(model),
    targetLanguage,
    preserveContext,
    textLength: text.length
  })

  if (isOpenRouterModel(model)) {
    return await translateWithOpenRouter({ text, targetLanguage, preserveContext, model })
  } else {
    return await translateWithLocalModel({ text, targetLanguage, preserveContext, model })
  }
}
async function translateWithOpenRouter({ text, targetLanguage, preserveContext, model }: TranslationRequest): Promise<string> {
  console.log('🌐 Using OpenRouter Model:', {
    model,
    targetLanguage,
    preserveContext
  })

  const openRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
  if (!openRouterKey) {
    throw new Error('OpenRouter API key is not configured')
  }

  const client = createOpenRouterClient(openRouterKey)
  
  const prompt = `Translate the following text to ${targetLanguage}. ${
                preserveContext ? 'Please maintain the literary context, style, and formatting.' : ''
                }\n\nText to translate:\n${text}`
  
  try {
    console.log('📤 Sending request to OpenRouter...')
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text }
      ]
    })
    console.log('📥 Received response from OpenRouter:', {
      status: 'success',
      responseLength: completion.choices[0].message.content?.length || 0
    })

    return completion.choices[0].message.content || ''
  } catch (error) {
    console.error('❌ OpenRouter translation error:', {
      model,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    throw new Error('Failed to translate text using OpenRouter')
  }
}

async function translateWithLocalModel({ text, targetLanguage, preserveContext, model }: TranslationRequest): Promise<string> {
  console.log('🏠 Using Local Model:', {
    model,
    targetLanguage,
    preserveContext
  })

  const prompt = `Translate the following text to ${targetLanguage}. ${
    preserveContext ? 'Please maintain the literary context, style, and formatting.' : ''
  }\n\nText to translate:\n${text}`

  if (model === 'gemini-2.0-flash') {
    // Gemini API
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!geminiKey) {
      throw new Error('Gemini API key is not configured')
    }

    try {
      console.log('📤 Sending request to Gemini...')
      const genAI = new GoogleGenerativeAI(geminiKey)
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const result = await geminiModel.generateContent(prompt)
      const response = await result.response
      const translatedText = response.text()

      console.log('📥 Received response from Gemini:', {
        status: 'success',
        model: 'gemini-2.0-flash',
        responseLength: translatedText.length
      })

      return translatedText
    } catch (error) {
      console.error('❌ Gemini translation error:', {
        model,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      throw new Error('Failed to translate text using Gemini')
    }
  } else {
    // OpenAI API
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!openaiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    try {
      console.log('📤 Sending request to OpenAI...')
      const openai = new OpenAI({
        apiKey: openaiKey,
        dangerouslyAllowBrowser: true
      })

      const modelName = model === 'gpt-4o' ? 'gpt-4' : 'gpt-3.5-turbo'

      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: 'You are a professional translator.' },
          { role: 'user', content: prompt }
        ]
      })

      const translatedText = completion.choices[0]?.message?.content || ''

      console.log('📥 Received response from OpenAI:', {
        status: 'success',
        responseLength: translatedText.length
      })

      return translatedText
    } catch (error) {
      console.error('❌ OpenAI translation error:', {
        model,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      throw new Error('Failed to translate text using OpenAI')
    }
  }
} 