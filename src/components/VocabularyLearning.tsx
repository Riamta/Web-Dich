'use client'

import { useState, useEffect } from 'react'
import { ClipboardIcon, PencilIcon, XMarkIcon, TrashIcon, BookOpenIcon, ArrowDownTrayIcon, SpeakerWaveIcon, CheckIcon, BookmarkIcon as BookmarkSolidIcon, BookmarkIcon, ArrowPathIcon, LanguageIcon, HashtagIcon, AcademicCapIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { VocabularyService } from '@/lib/vocabulary-service'
import { SUPPORTED_LANGUAGES, getLanguageName } from '@/constants/languages'

interface VocabularyItem {
  id?: string; // Add ID field for Firestore documents
  word: string
  meaning: string
  pronunciation: string
  example: string
  translation: string
  language?: string
  topic?: string
}

const COMMON_TOPICS = [
  { id: 'daily', name: 'Cuộc sống hàng ngày' },
  { id: 'business', name: 'Kinh doanh' },
  { id: 'technology', name: 'Công nghệ' },
  { id: 'travel', name: 'Du lịch' },
  { id: 'food', name: 'Ẩm thực' },
  { id: 'health', name: 'Sức khỏe' },
  { id: 'education', name: 'Giáo dục' },
  { id: 'entertainment', name: 'Giải trí' },
  { id: 'sports', name: 'Thể thao' },
  { id: 'music', name: 'Âm nhạc' },
]

const LEARNING_MODES = [
  { id: 'review', name: 'Xem và học' },
  { id: 'quiz', name: 'Kiểm tra từ vựng' },
]

const MODES = [
  { id: 'learn', name: 'Học từ mới' },
  { id: 'review', name: 'Ôn tập từ đã lưu' }
]

export default function VocabularyLearning() {
  const { user } = useAuth() // Get current user from auth context
  const [mode, setMode] = useState('learn')
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [nativeLanguage, setNativeLanguage] = useState('vi')
  const [selectedTopic, setSelectedTopic] = useState('custom')
  const [customTopic, setCustomTopic] = useState('Hãy cho tôi chủ đề bất kỳ mà bạn nghĩ sẽ thú vị')
  const [wordCount, setWordCount] = useState(5)
  const [learningMode, setLearningMode] = useState('review')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([])
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({})
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({})
  const [bookmarkedWords, setBookmarkedWords] = useState<VocabularyItem[]>([])
  const [showBookmarkModal, setShowBookmarkModal] = useState(false)
  const [searchWord, setSearchWord] = useState('')
  const [searchResult, setSearchResult] = useState<VocabularyItem | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Load bookmarked words from Firestore on component mount or when user changes
  useEffect(() => {
    const loadBookmarkedWords = async () => {
      if (!user) {
        setBookmarkedWords([])
        return
      }

      try {
        const q = query(
          collection(db, 'bookmarkedWords'),
          where('userId', '==', user.uid)
        )
        const querySnapshot = await getDocs(q)
        const words = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VocabularyItem[]
        setBookmarkedWords(words)
      } catch (error) {
        console.error('Error loading bookmarked words:', error)
      }
    }

    loadBookmarkedWords()
  }, [user])

  const toggleBookmark = async (word: VocabularyItem) => {
    if (!user) {
      alert('Vui lòng đăng nhập để lưu từ vựng')
      return
    }

    try {
      if (isBookmarked(word.word)) {
        // Remove from Firestore
        const wordDoc = bookmarkedWords.find(w => w.word === word.word)
        if (wordDoc?.id) {
          await deleteDoc(doc(db, 'bookmarkedWords', wordDoc.id))
        }
        setBookmarkedWords(prev => prev.filter(w => w.word !== word.word))
      } else {
        // Add to Firestore
        const wordData = {
          ...word,
          userId: user.uid,
          language: targetLanguage,
          topic: selectedTopic === 'custom' ? customTopic : selectedTopic,
          createdAt: new Date().toISOString()
        }
        const docRef = await addDoc(collection(db, 'bookmarkedWords'), wordData)
        setBookmarkedWords(prev => [...prev, { ...wordData, id: docRef.id }])
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      alert('Có lỗi xảy ra khi lưu từ vựng')
    }
  }

  const isBookmarked = (word: string) => {
    return bookmarkedWords.some(w => w.word === word)
  }

  const handleGenerateVocabulary = async () => {
    if (!targetLanguage) return

    setIsLoading(true)
    setError(null)
    setUserAnswers({})
    setShowAnswers({})

    try {
      if (mode === 'review') {
        // Filter bookmarked words by selected language if in review mode
        const filteredWords = bookmarkedWords.filter(word => word.language === targetLanguage)
        if (filteredWords.length === 0) {
          throw new Error(`Không có từ vựng ${SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage)?.name} nào được lưu`)
        }
        // Randomly select words if we have more than wordCount
        const shuffled = [...filteredWords].sort(() => Math.random() - 0.5)
        setVocabularyList(shuffled.slice(0, Math.min(wordCount, shuffled.length)))
        return
      }

      // Normal vocabulary generation for learn mode
      const topicToSend = selectedTopic === 'custom' ? customTopic : selectedTopic

      if (selectedTopic === 'custom' && !customTopic.trim()) {
        throw new Error('Vui lòng nhập chủ đề tùy chỉnh')
      }

      const data = await VocabularyService.generateVocabulary({
        targetLanguage,
        nativeLanguage,
        topic: topicToSend || 'random',
        wordCount: wordCount
      })

      setVocabularyList(data.vocabulary)
    } catch (error) {
      console.error('Vocabulary generation error:', error)
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo từ vựng')
    } finally {
      setIsLoading(false)
    }
  }

  const playPronunciation = (word: string, language: string) => {
    return (
      <button
        onClick={() => {
          const utterance = new SpeechSynthesisUtterance(word);
          utterance.lang = language;
          window.speechSynthesis.speak(utterance);
        }}
        className="btn btn-circle btn-ghost btn-sm"
      >
        <SpeakerWaveIcon className="h-5 w-5" />
      </button>
    );
  }

  const handleAnswerSubmit = (index: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [index]: answer
    }))
  }

  const checkAnswer = (index: number) => {
    setShowAnswers(prev => ({
      ...prev,
      [index]: true
    }))
  }

  const isAnswerCorrect = (index: number) => {
    const answer = userAnswers[index]?.toLowerCase().trim()
    const correctAnswer = vocabularyList[index]?.meaning.toLowerCase().trim()
    return answer === correctAnswer
  }

  const removeBookmark = async (word: VocabularyItem) => {
    if (!user || !word.id) return

    try {
      await deleteDoc(doc(db, 'bookmarkedWords', word.id))
      setBookmarkedWords(prev => prev.filter(w => w.id !== word.id))
    } catch (error) {
      console.error('Error removing bookmark:', error)
      alert('Có lỗi xảy ra khi xóa từ vựng')
    }
  }

  const getTopicName = (topicId: string) => {
    if (topicId === '') return 'Chủ đề ngẫu nhiên'
    const commonTopic = COMMON_TOPICS.find(topic => topic.id === topicId)
    return commonTopic ? commonTopic.name : topicId
  }

  const handleSearch = async () => {
    if (!searchWord.trim()) return

    setIsSearching(true)
    setError(null)
    setSearchResult(null)

    try {
      const data = await VocabularyService.generateVocabulary({
        targetLanguage,
        nativeLanguage,
        topic: '',
        searchWord: searchWord.trim(),
        wordCount: 1
      })

      if (data.vocabulary && data.vocabulary.length > 0) {
        setSearchResult(data.vocabulary[0])
      } else {
        throw new Error('Không tìm thấy từ này')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tra từ')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="grid grid-cols-2 gap-2 bg-gray-50/50 p-1 rounded-lg">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id)
                    setVocabularyList([])
                    setError(null)
                  }}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    mode === m.id 
                    ? 'bg-gray-800 text-white' 
                    : 'hover:bg-gray-100'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowBookmarkModal(true)}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50/80 transition-colors"
            >
              <BookmarkIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-800" />
              <span className="font-medium">Từ vựng đã lưu</span>
            </button>
          </div>

          {/* Settings Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <LanguageIcon className="h-5 w-5 text-gray-400" />
                  {mode === 'learn' ? 'Ngôn ngữ cần học' : 'Chọn ngôn ngữ ôn tập'}
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all bg-gray-50/50"
                >
                  {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto' && lang.code !== nativeLanguage).map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <LanguageIcon className="h-5 w-5 text-gray-400" />
                  Ngôn ngữ mẹ đẻ
                </label>
                <select
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all bg-gray-50/50"
                >
                  {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto' && lang.code !== targetLanguage).map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {mode === 'learn' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    Chủ đề
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => {
                      setSelectedTopic(e.target.value)
                      if (e.target.value !== 'custom') {
                        setCustomTopic('')
                      } else {
                        setCustomTopic('Hãy cho tôi chủ đề bất kỳ mà bạn nghĩ sẽ thú vị')
                      }
                    }}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all bg-gray-50/50"
                  >
                    <option value="custom">Chủ đề khác...</option>
                    <option value="">Để AI chọn chủ đề ngẫu nhiên</option>
                    {COMMON_TOPICS.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === 'learn' && selectedTopic === 'custom' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <PencilIcon className="h-5 w-5 text-gray-400" />
                    Nhập chủ đề của bạn
                  </label>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Ví dụ: Thể thao, Âm nhạc, ..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all bg-gray-50/50"
                    required={selectedTopic === 'custom'}
                  />
                  {selectedTopic === 'custom' && !customTopic.trim() && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <XMarkIcon className="h-4 w-4" />
                      Vui lòng nhập chủ đề bạn muốn học
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <HashtagIcon className="h-5 w-5 text-gray-400" />
                  {mode === 'learn' ? 'Số từ vựng' : 'Số từ ôn tập'}
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-gray-50/50">
                  <input
                    type="number"
                    value={wordCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 5
                      if (e.target.value === '') {
                        setWordCount(5)
                      } else if (value < 1) {
                        setWordCount(1)
                      } else if (value > 20) {
                        setWordCount(20)
                      } else {
                        setWordCount(value)
                      }
                    }}
                    min="1"
                    max="20"
                    className="flex-1 p-3 border-0 bg-transparent focus:ring-0"
                  />
                  <span className="px-4 py-3 bg-gray-100 text-gray-500 border-l border-gray-200">từ</span>
                </div>
                <p className="text-sm text-gray-500">(1-20 từ)</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                  Chế độ học
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50/50 p-1 rounded-lg">
                  {LEARNING_MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setLearningMode(m.id)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        learningMode === m.id 
                        ? 'bg-gray-800 text-white' 
                        : 'hover:bg-gray-100'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateVocabulary}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-900 shadow-sm hover:shadow-md'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang tạo từ vựng...
                </span>
              ) : (
                <>
                  {mode === 'learn' ? 'Tạo danh sách từ vựng' : 'Ôn tập từ vựng đã lưu'}
                  <ArrowPathIcon className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            <XMarkIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Vocabulary List */}
      {vocabularyList.length > 0 && (
        <div className="space-y-4">
          {vocabularyList.map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium">{item.word}</h3>
                    <button
                      onClick={() => toggleBookmark(item)}
                      className="text-gray-400 hover:text-gray-800 transition-colors"
                    >
                      {isBookmarked(item.word) ? (
                        <BookmarkSolidIcon className="h-5 w-5" />
                      ) : (
                        <BookmarkIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{item.pronunciation}</p>
                </div>
                <button
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(item.word);
                    utterance.lang = targetLanguage;
                    window.speechSynthesis.speak(utterance);
                  }}
                  className="p-2 hover:bg-gray-50/80 rounded-lg transition-colors"
                >
                  <SpeakerWaveIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {learningMode === 'quiz' ? (
                <div className="mt-6 space-y-4">
                  <div className="flex rounded-lg overflow-hidden border border-gray-200">
                    <input
                      type="text"
                      placeholder="Nhập nghĩa của từ..."
                      value={userAnswers[index] || ''}
                      onChange={(e) => handleAnswerSubmit(index, e.target.value)}
                      disabled={showAnswers[index]}
                      className="flex-1 p-3 border-0 focus:ring-0 bg-gray-50/50"
                    />
                    <button
                      onClick={() => checkAnswer(index)}
                      disabled={!userAnswers[index] || showAnswers[index]}
                      className="px-6 bg-gray-800 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {showAnswers[index] && (
                    <>
                      {/* Result Banner */}
                      <div className={`p-3 rounded-lg flex items-center gap-3 font-medium ${
                        isAnswerCorrect(index)
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        <div className="shrink-0">
                          {isAnswerCorrect(index) ? (
                            <CheckIcon className="h-5 w-5" />
                          ) : (
                            <XMarkIcon className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          {isAnswerCorrect(index)
                            ? 'Chính xác! Bạn đã chọn đúng nghĩa.'
                            : 'Chưa chính xác. Hãy xem giải thích bên dưới.'}
                        </div>
                      </div>
                      {/* Explanation Box */}
                      <div className={`p-4 rounded-lg ${
                        isAnswerCorrect(index)
                          ? 'bg-green-50 border-2 border-green-200 text-green-800'
                          : 'bg-red-50 border-2 border-red-200 text-red-800'
                      }`}>
                        <div className="space-y-2">
                          <p className="font-medium">Nghĩa đúng: {item.meaning}</p>
                          <div className="mt-2">
                            <p className="font-medium">Ví dụ:</p>
                            <p className="mt-1">{item.example}</p>
                            <p className="text-gray-600 mt-1">{item.translation}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-lg mt-4">{item.meaning}</p>
                  <div className="mt-4 bg-gray-50/50 p-4 rounded-lg space-y-2">
                    <p>{item.example}</p>
                    <p className="text-gray-600">{item.translation}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bookmarked Words Modal */}
      {showBookmarkModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <BookmarkIcon className="h-6 w-6 text-gray-800" />
                Từ vựng đã lưu
              </h2>
              <button
                onClick={() => setShowBookmarkModal(false)}
                className="p-2 hover:bg-gray-50/80 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {bookmarkedWords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50/80 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookmarkIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Chưa có từ vựng nào được lưu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookmarkedWords.map((word, index) => (
                    <div key={index} className="bg-gray-50/50 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-medium">{word.word}</h3>
                            <span className="px-3 py-1 bg-gray-800/5 text-gray-800 text-sm rounded-lg">
                              {getLanguageName(word.language || '')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{word.pronunciation}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const utterance = new SpeechSynthesisUtterance(word.word);
                              utterance.lang = word.language || 'en';
                              window.speechSynthesis.speak(utterance);
                            }}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                          >
                            <SpeakerWaveIcon className="h-5 w-5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => removeBookmark(word)}
                            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-red-500"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-4">{word.meaning}</p>
                      {word.topic && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                          <ClipboardIcon className="h-4 w-4" />
                          {getTopicName(word.topic)}
                        </p>
                      )}
                      <div className="mt-4 bg-white p-4 rounded-lg space-y-2">
                        <p>{word.example}</p>
                        <p className="text-gray-600">{word.translation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setShowBookmarkModal(false)}
                className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 