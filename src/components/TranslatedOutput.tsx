'use client'

import { useState } from 'react'
import { ClipboardDocumentIcon, ArrowDownTrayIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'

interface TranslatedOutputProps {
  text: string
  isLoading: boolean
}

export default function TranslatedOutput({ text, isLoading }: TranslatedOutputProps) {
  const [copySuccess, setCopySuccess] = useState(false)

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'translated-story.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text:', err)
      alert('Failed to copy text to clipboard')
    }
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100" suppressHydrationWarning>
      <div className="flex items-center">
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
          Translated Text
        </label>
      </div>
      <div className="relative">
        <div className="min-h-[800px] p-4 border border-gray-200 rounded-lg bg-gray-50/50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="text-sm text-gray-500">Translating your text...</p>
              </div>
            </div>
          ) : text ? (
            <div className="whitespace-pre-wrap text-gray-800">{text}</div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>Translated text will appear here...</span>
            </div>
          )}
        </div>
        
        {text && !isLoading && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCopy}
              className="p-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2 transition-all duration-200"
              title="Copy to clipboard"
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
              <span className="text-sm font-medium">{copySuccess ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg flex items-center gap-2 transition-all duration-200"
              title="Download as text file"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Download</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 