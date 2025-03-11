'use client'

import { useRef, ChangeEvent, useEffect } from 'react'
import { DocumentArrowUpIcon, LanguageIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { MdAdd, MdBook, MdClose } from 'react-icons/md'
import { dictionaryService } from '@/lib/dictionary-service'
import { useTabState } from '@/hooks/useTabState'

interface DictionaryEntry {
  from: string
  to: string
}

interface TranslationFormProps {
  onTranslate: (text: string, targetLanguage: string, preserveContext: boolean) => void
  isLoading: boolean
}

const SUPPORTED_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'Tiếng Anh' },
  { code: 'zh', name: 'Tiếng Trung' },
  { code: 'ja', name: 'Tiếng Nhật' },
  { code: 'ko', name: 'Tiếng Hàn' },
]

export default function TranslationForm({ onTranslate, isLoading }: TranslationFormProps) {
  const [text, setText] = useTabState('translateText', '')
  const [targetLanguage, setTargetLanguage] = useTabState('targetLanguage', 'vi')
  const [preserveContext, setPreserveContext] = useTabState('preserveContext', true)
  const [showDictionaryModal, setShowDictionaryModal] = useTabState('showDictionaryModal', false)
  const [dictionaryEntries, setDictionaryEntries] = useTabState<DictionaryEntry[]>('dictionaryEntries', [])
  const [newEntry, setNewEntry] = useTabState('newDictionaryEntry', { from: '', to: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDictionaryEntries()
  }, [])

  const loadDictionaryEntries = () => {
    const entries = dictionaryService.getAllEntries()
    setDictionaryEntries(entries)
  }

  const handleAddEntry = () => {
    if (newEntry.from && newEntry.to) {
      dictionaryService.addEntry(newEntry.from, newEntry.to)
      setNewEntry({ from: '', to: '' })
      loadDictionaryEntries()
    }
  }

  const handleRemoveEntry = (from: string) => {
    dictionaryService.removeEntry(from)
    loadDictionaryEntries()
  }

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
    <>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100" suppressHydrationWarning>
        <div className="space-y-2" suppressHydrationWarning>
          <div className="flex items-center justify-between">
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
              Source Text
            </label>
            <button
              type="button"
              onClick={() => setShowDictionaryModal(true)}
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-200"
            >
              <MdBook className="h-5 w-5" />
              <span>Từ điển</span>
            </button>
          </div>
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

      {/* Dictionary Modal */}
      {showDictionaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Quản lý từ điển thay thế</h3>
              <button
                onClick={() => setShowDictionaryModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <MdClose className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
                      Từ gốc
                    </label>
                    <input
                      type="text"
                      id="from"
                      value={newEntry.from}
                      onChange={(e) => setNewEntry({ ...newEntry, from: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Nhập từ cần thay thế..."
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                      Thay thế bằng
                    </label>
                    <input
                      type="text"
                      id="to"
                      value={newEntry.to}
                      onChange={(e) => setNewEntry({ ...newEntry, to: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Nhập từ thay thế..."
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddEntry}
                      disabled={!newEntry.from || !newEntry.to}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <MdAdd className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Từ gốc
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thay thế bằng
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dictionaryEntries.map((entry) => (
                        <tr key={entry.from}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.from}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.to}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveEntry(entry.from)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDictionaryModal(false)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 