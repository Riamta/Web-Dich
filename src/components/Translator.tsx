'use client'

import { useState, useEffect, useRef } from 'react'
import { useTabState } from '@/hooks/useTabState'
import { aiService } from '@/lib/ai-service'
import { TRANSLATION_TONES } from '@/lib/ai-service'
import { dictionaryService } from '@/lib/dictionary-service'
import { 
  ArrowsRightLeftIcon, 
  ClipboardDocumentIcon, 
  ArrowDownTrayIcon,
  SpeakerWaveIcon,
  DocumentArrowUpIcon,
  ChevronDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { MdTextFields, MdContentPaste } from 'react-icons/md'
import ReactMarkdown from 'react-markdown'
import { SUPPORTED_LANGUAGES } from '@/constants/languages'

export default function Translator() {
  const [mounted, setMounted] = useState(false)
  const [sourceText, setSourceText] = useTabState('translateText', '')
  const [translatedText, setTranslatedText] = useTabState('translatedText', '')
  const [sourceLanguage, setSourceLanguage] = useTabState('sourceLanguage', 'auto')
  const [targetLanguage, setTargetLanguage] = useTabState('targetLanguage', 'vi')
  const [translationTone, setTranslationTone] = useTabState('translationTone', 'normal')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useMarkdown, setUseMarkdown] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [contentHeight, setContentHeight] = useState<number>(500)
  const sourceTextRef = useRef<HTMLTextAreaElement>(null)
  const translatedTextRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const updateHeight = () => {
      if (sourceTextRef.current && translatedTextRef.current) {
        const sourceHeight = sourceTextRef.current.scrollHeight
        const translatedHeight = translatedTextRef.current.scrollHeight
        const maxHeight = Math.max(sourceHeight, translatedHeight, 500) // Minimum 500px
        setContentHeight(maxHeight)
      }
    }

    // Update height whenever content changes
    updateHeight()

    // Add resize observer to handle dynamic content changes
    const resizeObserver = new ResizeObserver(updateHeight)
    if (sourceTextRef.current) resizeObserver.observe(sourceTextRef.current)
    if (translatedTextRef.current) resizeObserver.observe(translatedTextRef.current)

    return () => resizeObserver.disconnect()
  }, [sourceText, translatedText])

  const handleTranslation = async () => {
    if (!sourceText.trim()) return
    
    setIsLoading(true)
    setError(null)
    try {
      const result = await aiService.translate(sourceText, targetLanguage, true, translationTone)
      const processedText = dictionaryService.applyDictionary(result)
      setTranslatedText(processedText)
    } catch (error) {
      console.error('Translation error:', error)
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi dịch văn bản')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setSourceText(text)
    } catch (err) {
      console.error('Failed to paste text:', err)
    }
  }

  const handleDownload = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'translated.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setSourceText(text)
    } catch (error) {
      console.error('Error reading file:', error)
      setError('Error reading file. Please try again.')
    }
  }

  // Don't render content until mounted (client-side)
  if (!mounted) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-0">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Language Selection Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="relative group flex-1 sm:flex-none">
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base font-medium min-w-0 sm:min-w-[160px] cursor-pointer"
              >
                <option value="auto">Detect Language</option>
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400 pointer-events-none" />
            </div>

            <button 
              className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-transparent hover:border-gray-200 shrink-0"
              onClick={() => {
                const temp = sourceLanguage
                setSourceLanguage(targetLanguage)
                setTargetLanguage(temp)
                const tempText = sourceText
                setSourceText(translatedText)
                setTranslatedText(tempText)
              }}
            >
              <ArrowsRightLeftIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
            </button>

            <div className="relative group flex-1 sm:flex-none">
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base font-medium min-w-0 sm:min-w-[160px] cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative group flex-1 sm:flex-none">
              <select
                value={translationTone}
                onChange={(e) => setTranslationTone(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base font-medium min-w-0 sm:min-w-[160px] cursor-pointer"
              >
                {Object.entries(TRANSLATION_TONES).map(([key, tone]) => (
                  <option key={key} value={key} title={tone.description}>
                    {tone.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400 pointer-events-none" />
              <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTranslation}
              disabled={isLoading || !sourceText.trim()}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-white text-sm sm:text-base font-medium transition-all ${
                isLoading || !sourceText.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md'
              }`}
            >
              {isLoading ? 'Translating...' : 'Translate'}
            </button>

            <button
              onClick={() => setUseMarkdown(!useMarkdown)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                useMarkdown 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
              title="Toggle Markdown rendering"
            >
              <MdTextFields className="h-4 w-4" />
              Markdown
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Source Text Panel */}
          <div className="relative">
            {/* Source Panel Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50/80">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Source Text</span>
                <button
                  onClick={() => setUseMarkdown(!useMarkdown)}
                  className={`sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    useMarkdown 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                  title="Toggle Markdown rendering"
                >
                  <MdTextFields className="h-3 w-3" />
                  MD
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                >
                  <MdContentPaste className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="text-xs sm:text-sm">Paste</span>
                </button>
                <button 
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                  onClick={() => handleCopy(sourceText)}
                  title="Copy to clipboard"
                >
                  <ClipboardDocumentIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="text-xs sm:text-sm">Copy</span>
                </button>
                <label 
                  htmlFor="file-upload"
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                  title="Upload file"
                >
                  <DocumentArrowUpIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="text-xs sm:text-sm">Upload</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".txt,.docx"
                  className="hidden"
                  id="file-upload"
                />
              </div>
            </div>
            <textarea
              ref={sourceTextRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleTranslation()
                }
              }}
              style={{ height: `${contentHeight}px` }}
              className="w-full p-4 sm:p-6 resize-none focus:outline-none text-base min-h-[300px] sm:min-h-[500px]"
              placeholder="Enter text to translate..."
            />
          </div>

          {/* Translated Text Panel */}
          <div className="relative">
            {/* Translated Panel Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50/80">
              <div className="text-sm font-medium text-gray-500">Translation</div>
              <div className="flex items-center gap-1">
                <button 
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                  onClick={() => handleCopy(translatedText)}
                  title="Copy to clipboard"
                >
                  <ClipboardDocumentIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="text-xs sm:text-sm">Copy</span>
                </button>
                <button
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                  onClick={() => handleDownload(translatedText)}
                  title="Download as text file"
                >
                  <ArrowDownTrayIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="text-xs sm:text-sm">Save</span>
                </button>
                <button 
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(translatedText)
                    utterance.lang = targetLanguage
                    window.speechSynthesis.speak(utterance)
                  }}
                  title="Listen to translation"
                >
                  <SpeakerWaveIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="text-xs sm:text-sm">Listen</span>
                </button>
              </div>
            </div>
            <div 
              ref={translatedTextRef}
              style={{ height: `${contentHeight}px` }}
              className="p-4 sm:p-6 overflow-y-auto min-h-[300px] sm:min-h-[500px]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full border-4 border-primary/30 border-t-transparent animate-spin" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 animate-pulse">Translating...</p>
                  </div>
                </div>
              ) : translatedText ? (
                <div className="prose max-w-none text-gray-800 text-base">
                  {useMarkdown ? (
                    <ReactMarkdown>{translatedText}</ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{translatedText}</div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base font-medium text-center">Translation will appear here</span>
                  <span className="text-xs sm:text-sm text-gray-400 text-center">Enter text and click Translate to begin</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
          <svg className="h-4 sm:h-5 w-4 sm:w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm sm:text-base font-medium">{error}</span>
        </div>
      )}
    </div>
  )
} 