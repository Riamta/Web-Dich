import { useState } from 'react'
import { DocumentArrowUpIcon, LanguageIcon, TagIcon } from '@heroicons/react/24/outline'
import { MdVolumeUp, MdCheck, MdClose } from 'react-icons/md'

interface VocabularyItem {
  word: string
  meaning: string
  pronunciation: string
  example: string
  translation: string
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'Tiếng Anh' },
  { code: 'zh', name: 'Tiếng Trung' },
  { code: 'ja', name: 'Tiếng Nhật' },
  { code: 'ko', name: 'Tiếng Hàn' },
]

const COMMON_TOPICS = [
  { id: 'daily', name: 'Cuộc sống hàng ngày' },
  { id: 'business', name: 'Kinh doanh' },
  { id: 'technology', name: 'Công nghệ' },
  { id: 'travel', name: 'Du lịch' },
  { id: 'food', name: 'Ẩm thực' },
  { id: 'health', name: 'Sức khỏe' },
  { id: 'education', name: 'Giáo dục' },
  { id: 'entertainment', name: 'Giải trí' },
]

const LEARNING_MODES = [
  { id: 'review', name: 'Xem và học' },
  { id: 'quiz', name: 'Kiểm tra từ vựng' },
]

export default function VocabularyLearning() {
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [learningMode, setLearningMode] = useState('review')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([])
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({})
  const [showAnswers, setShowAnswers] = useState<{[key: number]: boolean}>({})

  const handleGenerateVocabulary = async () => {
    if (!targetLanguage) return

    setIsLoading(true)
    setError(null)
    setUserAnswers({})
    setShowAnswers({})
    
    try {
      const response = await fetch('/api/generate-vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetLanguage,
          topic: selectedTopic || customTopic || 'random',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi tạo danh sách từ vựng')
      }

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <LanguageIcon className="h-5 w-5 text-gray-400" />
              Ngôn ngữ cần học
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/50"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-gray-400" />
              Chủ đề
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value)
                setCustomTopic('')
              }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/50"
            >
              <option value="">Để AI chọn chủ đề ngẫu nhiên</option>
              {COMMON_TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
              <option value="custom">Chủ đề khác...</option>
            </select>
          </div>
        </div>

        {selectedTopic === 'custom' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
              Nhập chủ đề của bạn
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Ví dụ: Thể thao, Âm nhạc, ..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50/50"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
            Chế độ học
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LEARNING_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setLearningMode(mode.id)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  learningMode === mode.id
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                }`}
              >
                {mode.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerateVocabulary}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md'
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
              Đang tạo danh sách từ vựng...
            </span>
          ) : (
            'Tạo danh sách từ vựng'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {vocabularyList.length > 0 && (
        <div className="space-y-4">
          {vocabularyList.map((item, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{item.word}</h3>
                  <p className="text-sm text-gray-500">{item.pronunciation}</p>
                </div>
                <button
                  onClick={() => playPronunciation(item.word, targetLanguage)}
                  className="p-2 text-gray-400 hover:text-primary transition-colors"
                >
                  <MdVolumeUp className="h-6 w-6" />
                </button>
              </div>

              {learningMode === 'quiz' ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập nghĩa của từ..."
                      value={userAnswers[index] || ''}
                      onChange={(e) => handleAnswerSubmit(index, e.target.value)}
                      disabled={showAnswers[index]}
                      className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      onClick={() => checkAnswer(index)}
                      disabled={!userAnswers[index] || showAnswers[index]}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300"
                    >
                      Kiểm tra
                    </button>
                  </div>

                  {showAnswers[index] && (
                    <div className={`p-3 rounded-lg ${
                      isAnswerCorrect(index)
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
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
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium">Ví dụ:</p>
                        <p>{item.example}</p>
                        <p className="text-gray-500">{item.translation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-gray-700">{item.meaning}</p>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                    <p className="text-sm text-gray-600">{item.example}</p>
                    <p className="text-sm text-gray-500">{item.translation}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 