'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { DocumentArrowUpIcon, LanguageIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface TranslationFormProps {
  onTranslate: (text: string, targetLanguage: string, preserveContext: boolean) => void
  isLoading: boolean
}

const SUPPORTED_LANGUAGES = [
  { code: 'vi', name: 'Vietnamese' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
]

export default function TranslationForm({ onTranslate, isLoading }: TranslationFormProps) {
  const [text, setText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('vi')
  const [preserveContext, setPreserveContext] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    onTranslate(text, targetLanguage, preserveContext)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100" suppressHydrationWarning>
      <div className="space-y-2">
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
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
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