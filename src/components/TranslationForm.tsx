'use client'

import { useState, useRef, ChangeEvent, useEffect } from 'react'
import { DocumentArrowUpIcon, LanguageIcon, SparklesIcon, CommandLineIcon } from '@heroicons/react/24/outline'
import { LOCAL_AI_MODELS, OPENROUTER_MODELS } from '../lib/api-config'

interface TranslationFormProps {
  onTranslate: (text: string, targetLanguage: string, preserveContext: boolean, model: string) => void
  isLoading: boolean
}

const SUPPORTED_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'Tiếng Anh' },
  { code: 'zh', name: 'Tiếng Trung' },
  { code: 'ja', name: 'Tiếng Nhật' },
  { code: 'ko', name: 'Tiếng Hàn' },
]

// Combine all AI models
const ALL_AI_MODELS = [
  ...LOCAL_AI_MODELS,
  { id: 'separator', name: '──────────', description: '' },
  ...OPENROUTER_MODELS,
]

export default function TranslationForm({ onTranslate, isLoading }: TranslationFormProps) {
  const [text, setText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('vi')
  const [preserveContext, setPreserveContext] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preserveContext') === 'true'
    }
    return true
  })
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('preferredLanguage')
      const savedModel = localStorage.getItem('preferredModel')
      const savedPreserveContext = localStorage.getItem('preserveContext')
      
      console.log('Loading saved preferences:', { savedLanguage, savedModel, savedPreserveContext })
      
      if (savedLanguage) {
        setTargetLanguage(savedLanguage)
      }
      if (savedModel) {
        setSelectedModel(savedModel)
      }
      if (savedPreserveContext !== null) {
        setPreserveContext(savedPreserveContext === 'true')
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }, [])

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!isClient) return // Don't save during SSR
    try {
      localStorage.setItem('preferredLanguage', targetLanguage)
      console.log('Saved language:', targetLanguage)
    } catch (error) {
      console.error('Error saving language:', error)
    }
  }, [targetLanguage, isClient])

  useEffect(() => {
    if (!isClient) return // Don't save during SSR
    try {
      localStorage.setItem('preferredModel', selectedModel)
      console.log('Saved model:', selectedModel)
    } catch (error) {
      console.error('Error saving model:', error)
    }
  }, [selectedModel, isClient])

  useEffect(() => {
    if (!isClient) return // Don't save during SSR
    try {
      localStorage.setItem('preserveContext', preserveContext.toString())
      console.log('Saved preserveContext:', preserveContext)
    } catch (error) {
      console.error('Error saving preserveContext:', error)
    }
  }, [preserveContext, isClient])

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setText(text)
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading file. Please try again.')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) {
      alert('Please enter some text to translate')
      return
    }
    onTranslate(text, targetLanguage, preserveContext, selectedModel)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100" suppressHydrationWarning>
      <div className="space-y-2" suppressHydrationWarning>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
          Source Text
        </label>
        <textarea
          id="text"
          value={text}
          onChange={handleTextChange}
          className="w-full h-[400px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none text-gray-800 placeholder-gray-400 bg-gray-50/50"
          placeholder="Enter or paste your text here..."
          suppressHydrationWarning
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" suppressHydrationWarning>
        <div className="space-y-2">
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <CommandLineIcon className="h-5 w-5 text-gray-400" />
            AI Model
          </label>
          <div className="relative">
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/50 text-gray-800"
            >
              {ALL_AI_MODELS.map((model) => (
                <option 
                  key={model.id} 
                  value={model.id} 
                  disabled={model.id === 'separator'}
                  className={`py-2 ${model.id === 'separator' ? 'text-gray-400 font-bold' : ''}`}
                >
                  {model.name}
                </option>
              ))}
            </select>
            {selectedModel && (
              <p className="mt-1 text-xs text-gray-500">
                {ALL_AI_MODELS.find(m => m.id === selectedModel)?.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <LanguageIcon className="h-5 w-5 text-gray-400" />
            Target Language
          </label>
          <div className="relative">
            <select
              id="language"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full p-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/50 text-gray-800"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" suppressHydrationWarning>
        <div className="flex items-center gap-2 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
          <input
            type="checkbox"
            id="preserveContext"
            checked={preserveContext}
            onChange={(e) => setPreserveContext(e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-primary/20 border-gray-300 rounded transition-all duration-200"
          />
          <label htmlFor="preserveContext" className="text-sm text-gray-700 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-gray-400" />
            Preserve literary context and style
          </label>
        </div>

        <div className="space-y-2">
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
            Upload File
          </label>
          <input
            type="file"
            id="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.docx"
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md'
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Translating...
          </>
        ) : (
          <>
            <LanguageIcon className="h-5 w-5" />
            Translate Story
          </>
        )}
      </button>
    </form>
  )
} 