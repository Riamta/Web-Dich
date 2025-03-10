'use client'

import { useState } from 'react'
import TranslationForm from '@/components/TranslationForm'
import TranslatedOutput from '@/components/TranslatedOutput'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default function Home() {
  const [translatedText, setTranslatedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleTranslation = async (text: string, targetLanguage: string, preserveContext: boolean) => {
    try {
      setIsLoading(true)
      // Initialize Gemini API (you'll need to add your API key in a secure way)
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const prompt = `Translate the following text to ${targetLanguage}. ${
        preserveContext ? 'Please maintain the literary context and style. Only translate the text, do not add any additional information or commentary.' : ''
      }\n\nText to translate:\n${text}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const translatedContent = response.text()
      
      setTranslatedText(translatedContent)
    } catch (error) {
      console.error('Translation error:', error)
      alert('Error during translation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8" suppressHydrationWarning>
      <h1 className="text-4xl font-bold text-center mb-8">Story Translator</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TranslationForm onTranslate={handleTranslation} isLoading={isLoading} />
        <TranslatedOutput text={translatedText} isLoading={isLoading} />
      </div>
    </main>
  )
} 