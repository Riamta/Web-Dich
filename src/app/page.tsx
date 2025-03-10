'use client'

import { useState } from 'react'
import TranslationForm from '@/components/TranslationForm'
import TranslatedOutput from '@/components/TranslatedOutput'
import { translateText } from '@/lib/translation-service'

export default function Home() {
  const [translatedText, setTranslatedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleTranslation = async (
    text: string, 
    targetLanguage: string, 
    preserveContext: boolean,
    model: string
  ) => {
    try {
      setIsLoading(true)
      const translatedContent = await translateText({
        text,
        targetLanguage,
        preserveContext,
        model
      })
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
      <h1 className="text-4xl font-bold text-center mb-8">Translator</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TranslationForm onTranslate={handleTranslation} isLoading={isLoading} />
        <TranslatedOutput text={translatedText} isLoading={isLoading} />
      </div>
    </main>
  )
} 