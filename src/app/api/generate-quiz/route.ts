import { NextResponse } from 'next/server'
import { aiService } from '@/lib/ai-service'

export async function POST(request: Request) {
  try {
    const { 
      prompt, 
      numQuestions = 1, 
      explanationLanguage = 'vi',
      difficulty = 'medium'
    } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Vui lòng nhập yêu cầu tạo câu hỏi' },
        { status: 400 }
      )
    }

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

    const systemPrompt = `
      Bạn là một giáo viên chuyên tạo câu hỏi trắc nghiệm. 
      Hãy tạo ${numQuestions} câu hỏi dựa trên yêu cầu của người dùng.
      
      Độ khó yêu cầu: ${getDifficultyDescription(difficulty)}

      Giải thích bằng ${explanationLanguage === 'vi' ? 'tiếng Việt' : 
        explanationLanguage === 'en' ? 'tiếng Anh' :
        explanationLanguage === 'zh' ? 'tiếng Trung' :
        explanationLanguage === 'ja' ? 'tiếng Nhật' :
        explanationLanguage === 'ko' ? 'tiếng Hàn' : 'tiếng Việt'}.
      
      Yêu cầu định dạng:
      1. Mỗi câu hỏi phải có:
         - Câu hỏi rõ ràng, dễ hiểu
         - 4 đáp án lựa chọn
         - Chỉ có 1 đáp án đúng
         - Giải thích chi tiết tại sao đáp án đó là đúng (bằng ${explanationLanguage === 'vi' ? 'tiếng Việt' : 
            explanationLanguage === 'en' ? 'tiếng Anh' :
            explanationLanguage === 'zh' ? 'tiếng Trung' :
            explanationLanguage === 'ja' ? 'tiếng Nhật' :
            explanationLanguage === 'ko' ? 'tiếng Hàn' : 'tiếng Việt'})
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
      - Tạo đúng ${numQuestions} câu hỏi
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
      if (questions.questions.length !== numQuestions) {
        throw new Error(`Expected ${numQuestions} questions but got ${questions.questions.length}`)
      }

      questions.questions.forEach((q: any, index: number) => {
        if (!q.id || !q.question || !Array.isArray(q.options) || 
            q.options.length !== 4 || typeof q.correctAnswer !== 'number' || 
            !q.explanation) {
          throw new Error(`Invalid question format at index ${index}`)
        }
      })

    } catch (error) {
      console.error('Failed to parse AI response:', response)
      throw new Error('Lỗi khi xử lý câu trả lời từ AI. Vui lòng thử lại.')
    }

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo câu hỏi' },
      { status: 500 }
    )
  }
} 