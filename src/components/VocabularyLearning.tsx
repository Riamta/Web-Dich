import { useState, useEffect } from 'react'
import { DocumentArrowUpIcon, LanguageIcon, TagIcon } from '@heroicons/react/24/outline'
import { MdVolumeUp, MdCheck, MdClose, MdBookmark, MdBookmarkBorder, MdRefresh } from 'react-icons/md'
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
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = language
    window.speechSynthesis.speak(utterance)
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
    <div className="flex gap-6 max-w-[1400px] mx-auto p-6">
      {/* Left Panel - Dictionary */}
      <div className="w-[400px] flex-shrink-0 h-fit">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900">Tra từ điển</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <LanguageIcon className="h-5 w-5 text-primary/60" />
                  Ngôn ngữ cần tra
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/30 hover:border-primary/50"
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
                  <LanguageIcon className="h-5 w-5 text-primary/60" />
                  Ngôn ngữ mẹ đẻ
                </label>
                <select
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/30 hover:border-primary/50"
                >
                  {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto' && lang.code !== targetLanguage).map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <DocumentArrowUpIcon className="h-5 w-5 text-primary/60" />
                Nhập từ cần tra
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  placeholder="Nhập từ cần tra..."
                  className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50/30 hover:border-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchWord.trim()) {
                      handleSearch()
                    }
                  }}
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchWord.trim()}
                  className={`px-4 py-3 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.02] ${
                    isSearching || !searchWord.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg'
                  }`}
                >
                  {isSearching ? (
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
                    </span>
                  ) : (
                    'Tra từ'
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 flex items-center gap-2 text-sm">
                <MdClose className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {searchResult && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">{searchResult.word}</h3>
                      <button
                        onClick={() => toggleBookmark(searchResult)}
                        className="text-primary hover:text-primary/80 transition-colors transform hover:scale-110 duration-200"
                      >
                        {isBookmarked(searchResult.word) ? (
                          <MdBookmark className="h-5 w-5" />
                        ) : (
                          <MdBookmarkBorder className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{searchResult.pronunciation}</p>
                  </div>
                  <button
                    onClick={() => playPronunciation(searchResult.word, targetLanguage)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors transform hover:scale-110 duration-200"
                  >
                    <MdVolumeUp className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-gray-700 text-base">{searchResult.meaning}</p>
                <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-2">
                  <p className="text-gray-600 text-sm">{searchResult.example}</p>
                  <p className="text-gray-500 text-sm">{searchResult.translation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Main Content */}
      <div className="flex-1 space-y-6">
        {/* Main Settings Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mode Selection */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="grid grid-cols-2 gap-4 flex-1">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id)
                      setVocabularyList([])
                      setError(null)
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${mode === m.id
                      ? 'bg-primary/10 text-primary border-primary font-medium shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-primary/50 hover:text-primary'
                      }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowBookmarkModal(true)}
                className="ml-4 px-6 py-4 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300 flex items-center gap-2 font-medium hover:shadow-lg"
              >
                <MdBookmark className="h-5 w-5" />
                Từ vựng đã lưu
              </button>
            </div>
          </div>

          {/* Settings Form */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <LanguageIcon className="h-5 w-5 text-primary/60" />
                  {mode === 'learn' ? 'Ngôn ngữ cần học' : 'Chọn ngôn ngữ ôn tập'}
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/30 hover:border-primary/50"
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
                  <LanguageIcon className="h-5 w-5 text-primary/60" />
                  Ngôn ngữ mẹ đẻ
                </label>
                <select
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/30 hover:border-primary/50"
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
                    <TagIcon className="h-5 w-5 text-primary/60" />
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
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/30 hover:border-primary/50"
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
            </div>

            {mode === 'learn' && selectedTopic === 'custom' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DocumentArrowUpIcon className="h-5 w-5 text-primary/60" />
                  Nhập chủ đề của bạn
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Ví dụ: Thể thao, Âm nhạc, ..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50/30 hover:border-primary/50"
                  required={selectedTopic === 'custom'}
                />
                {selectedTopic === 'custom' && !customTopic.trim() && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <MdClose className="h-4 w-4" />
                    Vui lòng nhập chủ đề bạn muốn học
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DocumentArrowUpIcon className="h-5 w-5 text-primary/60" />
                  {mode === 'learn' ? 'Số từ vựng' : 'Số từ ôn tập'}
                </label>
                <div className="flex items-center gap-2">
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
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/30 hover:border-primary/50"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    (1-20 từ)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DocumentArrowUpIcon className="h-5 w-5 text-primary/60" />
                  Chế độ học
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LEARNING_MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setLearningMode(m.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${learningMode === m.id
                        ? 'bg-primary/10 text-primary border-primary font-medium shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-primary/50 hover:text-primary'
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
              className={`w-full py-4 px-6 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.02] ${isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg'
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
                  {mode === 'learn' ? 'Đang tạo danh sách từ vựng...' : 'Đang tải từ vựng đã lưu...'}
                </span>
              ) : (
                <>
                  {mode === 'learn' ? 'Tạo danh sách từ vựng' : 'Ôn tập từ vựng đã lưu'}
                  <MdRefresh className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 flex items-center gap-2">
            <MdClose className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Vocabulary List */}
        {vocabularyList.length > 0 && (
          <div className="space-y-4">
            {vocabularyList.map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-medium text-gray-900">{item.word}</h3>
                      <button
                        onClick={() => toggleBookmark(item)}
                        className="text-primary hover:text-primary/80 transition-colors transform hover:scale-110 duration-200"
                      >
                        {isBookmarked(item.word) ? (
                          <MdBookmark className="h-6 w-6" />
                        ) : (
                          <MdBookmarkBorder className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{item.pronunciation}</p>
                  </div>
                  <button
                    onClick={() => playPronunciation(item.word, targetLanguage)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors transform hover:scale-110 duration-200"
                  >
                    <MdVolumeUp className="h-6 w-6" />
                  </button>
                </div>

                {learningMode === 'quiz' ? (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Nhập nghĩa của từ..."
                        value={userAnswers[index] || ''}
                        onChange={(e) => handleAnswerSubmit(index, e.target.value)}
                        disabled={showAnswers[index]}
                        className="flex-1 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      />
                      <button
                        onClick={() => checkAnswer(index)}
                        disabled={!userAnswers[index] || showAnswers[index]}
                        className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:bg-gray-300 transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        Kiểm tra
                      </button>
                    </div>

                    {showAnswers[index] && (
                      <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${isAnswerCorrect(index)
                        ? 'bg-green-50/50 border-green-200'
                        : 'bg-red-50/50 border-red-200'
                        }`}>
                        <div className="flex items-center gap-2">
                          {isAnswerCorrect(index) ? (
                            <MdCheck className="h-5 w-5 text-green-500" />
                          ) : (
                            <MdClose className="h-5 w-5 text-red-500" />
                          )}
                          <p className={isAnswerCorrect(index) ? 'text-green-700' : 'text-red-700'}>
                            {isAnswerCorrect(index)
                              ? 'Chính xác!'
                              : `Đáp án đúng là: ${item.meaning}`}
                          </p>
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                          <p className="font-medium">Ví dụ:</p>
                          <p className="mt-1">{item.example}</p>
                          <p className="text-gray-500 mt-1">{item.translation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 text-lg">{item.meaning}</p>
                    <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-2">
                      <p className="text-gray-600">{item.example}</p>
                      <p className="text-gray-500">{item.translation}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bookmarked Words Modal */}
        {showBookmarkModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <MdBookmark className="h-6 w-6 text-primary" />
                  Từ vựng đã lưu
                </h2>
                <button
                  onClick={() => setShowBookmarkModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <MdClose className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {bookmarkedWords.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <MdBookmarkBorder className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Chưa có từ vựng nào được lưu</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookmarkedWords.map((word, index) => (
                      <div key={index} className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-3 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-medium text-gray-900">{word.word}</h3>
                              <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded-lg">
                                {getLanguageName(word.language || '')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{word.pronunciation}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => playPronunciation(word.word, word.language || 'en')}
                              className="p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-white"
                            >
                              <MdVolumeUp className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => removeBookmark(word)}
                              className="p-2 text-red-400 hover:text-red-500 transition-colors rounded-full hover:bg-white"
                            >
                              <MdClose className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700">{word.meaning}</p>
                        {word.topic && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <TagIcon className="h-4 w-4" />
                            {getTopicName(word.topic)}
                          </p>
                        )}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                          <p className="text-gray-600">{word.example}</p>
                          <p className="text-gray-500">{word.translation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={() => setShowBookmarkModal(false)}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 