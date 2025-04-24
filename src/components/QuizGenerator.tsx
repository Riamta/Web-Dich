'use client'

import { useState } from 'react'
import { DocumentArrowUpIcon, LanguageIcon } from '@heroicons/react/24/outline'
import { MdCheck, MdClose } from 'react-icons/md'
import { aiService } from '@/lib/ai-service'
import { SUPPORTED_LANGUAGES } from '@/constants/languages'

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

const DIFFICULTY_LEVELS = [
  { code: 'easy', name: 'Dễ' },
  { code: 'medium', name: 'Bình thường' },
  { code: 'hard', name: 'Khó' },
  { code: 'expert', name: 'Chuyên gia' },
]

const getDifficultyDescription = (level: string) => {
  switch (level) {
    case 'easy':
      return 'dễ, phù hợp cho người mới bắt đầu, kiến thức cơ bản'
    case 'medium':
      return 'trung bình, đòi hỏi hiểu biết tốt về chủ đề'
    case 'hard':
      return 'khó, yêu cầu kiến thức chuyên sâu và khả năng phân tích'
    case 'expert':
      return 'chuyên gia, cực kỳ khó, đòi hỏi hiểu biết toàn diện và khả năng xử lý tình huống phức tạp'
    default:
      return 'trung bình'
  }
}

export default function QuizGenerator() {
  const [prompt, setPrompt] = useState('')
  const [numQuestions, setNumQuestions] = useState<string>('1')
  const [explanationLanguage, setExplanationLanguage] = useState('vi')
  const [difficulty, setDifficulty] = useState('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({})
  const [showExplanations, setShowExplanations] = useState<{[key: number]: boolean}>({})

  const handleGenerateQuiz = async () => {
    if (!prompt.trim()) return
    
    // Validate number of questions before submitting
    const validatedNumQuestions = numQuestions === '' ? 1 : Math.min(10, Math.max(1, parseInt(numQuestions)));
    setNumQuestions(validatedNumQuestions.toString());

    setIsLoading(true)
    setError(null)
    try {
      const systemPrompt = `
        Bạn là một giáo viên chuyên tạo câu hỏi trắc nghiệm. 
        Hãy tạo ${validatedNumQuestions} câu hỏi dựa trên yêu cầu của người dùng.
        
        Độ khó yêu cầu: ${getDifficultyDescription(difficulty)}

        Giải thích bằng ${SUPPORTED_LANGUAGES.find(lang => lang.code === explanationLanguage)?.name}
        
        Yêu cầu định dạng:
        1. Mỗi câu hỏi phải có:
           - Câu hỏi rõ ràng, dễ hiểu
           - 4 đáp án lựa chọn
           - Chỉ có 1 đáp án đúng
           - Giải thích chi tiết tại sao đáp án đó là đúng ( bằng ${SUPPORTED_LANGUAGES.find(lang => lang.code === explanationLanguage)?.name})
           - Đảm bảo độ khó phù hợp với yêu cầu
        
        2. Trả về kết quả CHÍNH XÁC theo định dạng JSON sau:
        {
          "questions": [
            {
              "id": 1,
              "question": "Câu hỏi...",
              "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
              "correctAnswer": 0,
              "explanation": "Giải thích..."
            }
          ]
        }

        Lưu ý:
        - Tạo đúng ${validatedNumQuestions} câu hỏi
        - Độ khó phải đúng theo yêu cầu: ${getDifficultyDescription(difficulty)}
        - Chỉ trả về JSON, không thêm bất kỳ text nào khác
        - correctAnswer là index của đáp án đúng (0-3)
        - Đảm bảo JSON hợp lệ và đúng định dạng
        - Không thêm dấu backtick hoặc markdown
      `

      const response = await aiService.generateQuiz(systemPrompt, prompt)
      let questions

      try {
        // Clean up response to ensure valid JSON
        const jsonStr = response.trim().replace(/```json\s*|\s*```/g, '').trim()
        questions = JSON.parse(jsonStr)

        // Validate response structure
        if (!questions.questions || !Array.isArray(questions.questions)) {
          throw new Error('Invalid response format')
        }

        // Validate each question and number of questions
        if (questions.questions.length !== validatedNumQuestions) {
          throw new Error(`Expected ${validatedNumQuestions} questions but got ${questions.questions.length}`)
        }

        questions.questions.forEach((q: any, index: number) => {
          if (!q.id || !q.question || !Array.isArray(q.options) || 
              q.options.length !== 4 || typeof q.correctAnswer !== 'number' || 
              !q.explanation) {
            throw new Error(`Invalid question format at index ${index}`)
          }
        })

        setQuestions(questions.questions)
        setSelectedAnswers({})
        setShowExplanations({})
      } catch (error) {
        console.error('Failed to parse AI response:', response)
        throw new Error('Lỗi khi xử lý câu trả lời từ AI. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Quiz generation error:', error)
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo câu hỏi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }))
    setShowExplanations(prev => ({
      ...prev,
      [questionId]: true
    }))
  }

  const isAnswerCorrect = (questionId: number) => {
    const question = questions.find(q => q.id === questionId)
    return question && selectedAnswers[questionId] === question.correctAnswer
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
            Nhập yêu cầu tạo câu hỏi
          </label>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ví dụ: Tạo câu hỏi trắc nghiệm tiếng Anh về thì hiện tại đơn..."
          className="w-full h-32 p-4 font-mono text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-gray-50/50"
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
              Số lượng câu hỏi
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={numQuestions}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 10)) {
                  setNumQuestions(value);
                }
              }}
              placeholder="Nhập số lượng (1-10)"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50/50"
            />
            <p className="text-sm text-gray-500 mt-1">Tối đa 10 câu hỏi</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <LanguageIcon className="h-5 w-5 text-gray-400" />
              Ngôn ngữ câu hỏi
            </label>
            <select
              value={explanationLanguage}
              onChange={(e) => setExplanationLanguage(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/50"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
            Độ khó
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level.code}
                onClick={() => setDifficulty(level.code)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  difficulty === level.code
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'border-gray-200 text-gray-700 hover:border-gray-800 hover:text-gray-800'
                }`}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerateQuiz}
          disabled={isLoading || !prompt.trim()}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isLoading || !prompt.trim()
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
              Đang tạo câu hỏi...
            </span>
          ) : (
            'Tạo câu hỏi'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {question.id}. {question.question}
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {question.options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index);
                  const isSelected = selectedAnswers[question.id] === index;
                  const isCorrect = question.correctAnswer === index;
                  const hasAnswered = selectedAnswers[question.id] !== undefined;
                  
                  // Determine button style based on state
                  const buttonStyle = hasAnswered
                    ? isCorrect
                      ? 'border-green-500 bg-green-100 ring-2 ring-green-500 shadow-lg shadow-green-100'
                      : isSelected
                        ? 'border-red-500 bg-red-100 ring-2 ring-red-500 shadow-lg shadow-red-100'
                        : 'border-gray-200 opacity-50'
                    : 'border-gray-200 hover:border-primary hover:bg-gray-50';

                  // Determine circle style based on state
                  const circleStyle = hasAnswered
                    ? isCorrect
                      ? isSelected
                        ? 'border-green-500 bg-green-600 text-white shadow-md scale-110'
                        : 'border-green-500 bg-green-500 text-white'
                      : isSelected
                        ? 'border-red-500 bg-red-600 text-white shadow-md scale-110'
                        : 'border-gray-300 text-gray-400'
                    : 'border-gray-300 text-gray-500';

                  return (
                    <button
                      key={index}
                      onClick={() => !hasAnswered && handleAnswerSelect(question.id, index)}
                      disabled={hasAnswered}
                      className={`p-4 text-left rounded-lg border transition-all duration-200 ${
                        hasAnswered && isSelected ? 'transform scale-[1.02]' : ''
                      } ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-medium transition-all duration-200 ${circleStyle}`}>
                          {letter}
                        </div>
                        <span className={`flex-1 ${hasAnswered && isSelected ? 'font-medium' : ''}`}>{option}</span>
                        {hasAnswered && (isSelected || isCorrect) && (
                          <div className="shrink-0">
                            {isCorrect ? (
                              <MdCheck className={`h-6 w-6 ${isSelected ? 'text-green-600 scale-125' : 'text-green-500'}`} />
                            ) : (
                              isSelected && <MdClose className="h-6 w-6 text-red-600 scale-125" />
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {showExplanations[question.id] && (
                <>
                  {/* Result Banner */}
                  <div className={`mb-3 p-3 rounded-lg flex items-center gap-3 font-medium ${
                    isAnswerCorrect(question.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    <div className="shrink-0">
                      {isAnswerCorrect(question.id) ? (
                        <MdCheck className="h-6 w-6" />
                      ) : (
                        <MdClose className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      {isAnswerCorrect(question.id)
                        ? 'Chính xác! Bạn đã chọn đúng đáp án.'
                        : 'Chưa chính xác. Hãy xem giải thích bên dưới.'}
                    </div>
                  </div>
                  {/* Explanation Box */}
                  <div className={`p-4 rounded-lg ${
                    isAnswerCorrect(question.id)
                      ? 'bg-green-50 border-2 border-green-200 text-green-800'
                      : 'bg-red-50 border-2 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="font-medium mt-0.5">Giải thích:</div>
                      <div className="flex-1">
                        <p className="mb-2">{question.explanation}</p>
                        {!isAnswerCorrect(question.id) && (
                          <p className="font-medium">
                            Đáp án đúng là: {String.fromCharCode(65 + question.correctAnswer)}
                          </p>
                        )}
                      </div>
                    </div>
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