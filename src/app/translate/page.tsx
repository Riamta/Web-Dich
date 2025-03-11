'use client'

import { useState } from 'react'
import TranslationForm from '@/components/TranslationForm'
import TranslatedOutput from '@/components/TranslatedOutput'
import { aiService } from '@/lib/ai-service'

export default function TranslatePage() {
  const [translatedText, setTranslatedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | undefined>()

  const handleTranslate = async (
    text: string,
    targetLanguage: string,
    preserveContext: boolean,
    onProgress: (current: number, total: number) => void
  ) => {
    try {
      setIsLoading(true)
      setTranslatedText('')
      
      const result = await aiService.translate(
        text,
        targetLanguage,
        preserveContext,
        (current, total) => {
          setProgress({ current, total })
          onProgress(current, total)
        }
      )
      
      setTranslatedText(result)
    } catch (error) {
      console.error('Translation error:', error)
      alert('Có lỗi xảy ra khi dịch văn bản. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
      setProgress(undefined)
    }
  }

  const handleTextChange = (newText: string) => {
    setTranslatedText(newText)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <TranslationForm
        onTranslate={handleTranslate}
        isLoading={isLoading}
        progress={progress}
      />
      <TranslatedOutput
        text={translatedText}
        isLoading={isLoading}
        progress={progress}
        onTextChange={handleTextChange}
      />
    </div>
  )
} 