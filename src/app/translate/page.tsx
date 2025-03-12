'use client'

import { useState, useEffect } from 'react'
import TranslationForm from '@/components/TranslationForm'
import TranslatedOutput from '@/components/TranslatedOutput'
import { aiService } from '@/lib/ai-service'
import { dictionaryService } from '@/lib/dictionary-service'
import { useTabState } from '@/hooks/useTabState'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [translatedText, setTranslatedText] = useTabState('translatedText', '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleTranslation = async (
    text: string, 
    targetLanguage: string, 
    preserveContext: boolean
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await aiService.translate(text, targetLanguage, preserveContext)
      const processedText = dictionaryService.applyDictionary(result)
      setTranslatedText(processedText)
    } catch (error) {
      console.error('Translation error:', error)
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi dịch văn bản')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranslatedTextChange = (newText: string) => {
    const processedText = dictionaryService.applyDictionary(newText)
    setTranslatedText(processedText)
  }

  // Don't render content until mounted (client-side)
  if (!mounted) {
    return <main className="container mx-auto px-4 py-8"><div className="min-h-screen"></div></main>
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <TranslationForm onTranslate={handleTranslation} isLoading={isLoading} />
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}
        </div>
        <TranslatedOutput 
          text={translatedText} 
          isLoading={isLoading} 
          onTextChange={handleTranslatedTextChange}
        />
      </div>
    </main>
  )
} 