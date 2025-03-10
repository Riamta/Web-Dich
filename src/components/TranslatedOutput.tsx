'use client'

import { useState, useEffect } from 'react'
import { ClipboardDocumentIcon, ArrowDownTrayIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import { MdEdit, MdClose } from 'react-icons/md'

interface TranslatedOutputProps {
  text: string
  isLoading: boolean
  onTextChange?: (text: string) => void
}

export default function TranslatedOutput({ text, isLoading, onTextChange }: TranslatedOutputProps) {
  const [mounted, setMounted] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editedText, setEditedText] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted (client-side)
  if (!mounted) {
    return <div className="min-h-[800px]"></div>
  }

  const handleDownload = () => {
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

  const handleOpenEditModal = () => {
    setEditedText(text)
    setShowEditModal(true)
  }

  const handleSaveEdit = () => {
    if (onTextChange) {
      onTextChange(editedText)
    }
    setShowEditModal(false)
  }

  return (
    <>
      <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100" suppressHydrationWarning>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
            Translated Text
          </label>
          {text && !isLoading && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenEditModal}
                className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-200"
              >
                <MdEdit className="h-5 w-5" />
                <span>Chỉnh sửa</span>
              </button>
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
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Chỉnh sửa bản dịch</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <MdClose className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-[800px] p-4 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                placeholder="Chỉnh sửa nội dung bản dịch..."
              />
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 