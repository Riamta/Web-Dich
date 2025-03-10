import { NextResponse } from 'next/server'
import { aiService } from '@/lib/ai-service'

export async function POST(req: Request) {
  try {
    const { targetLanguage, topic } = await req.json()

    const systemPrompt = `Bạn là một giáo viên ngôn ngữ chuyên nghiệp. Hãy tạo danh sách 10 từ vựng ${
      topic === 'random' ? 'với chủ đề do bạn chọn' : `về chủ đề "${topic}"`
    } cho người học ${targetLanguage === 'en' ? 'tiếng Anh' : targetLanguage === 'zh' ? 'tiếng Trung' : targetLanguage === 'ja' ? 'tiếng Nhật' : 'tiếng Hàn'}.

Mỗi từ vựng cần có:
1. Từ gốc
2. Phiên âm (IPA cho tiếng Anh, Pinyin cho tiếng Trung, Hiragana/Katakana cho tiếng Nhật, Hangul cho tiếng Hàn)
3. Nghĩa tiếng Việt
4. Một câu ví dụ sử dụng từ đó
5. Bản dịch tiếng Việt của câu ví dụ

Trả về kết quả dưới dạng JSON với cấu trúc sau:
{
  "vocabulary": [
    {
      "word": string,
      "pronunciation": string,
      "meaning": string,
      "example": string,
      "translation": string
    }
  ]
}

Chú ý: Chỉ trả về JSON thuần túy, không thêm markdown hoặc định dạng khác.`

    const response = await aiService.processWithAI(systemPrompt)
    let data
    
    try {
      // Clean the response by removing markdown formatting
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
      data = JSON.parse(cleanedResponse)
    } catch (e) {
      console.error('Invalid JSON response:', response)
      throw new Error('Lỗi khi xử lý phản hồi từ AI')
    }

    if (!data.vocabulary || !Array.isArray(data.vocabulary)) {
      throw new Error('Định dạng dữ liệu không hợp lệ')
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Vocabulary generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Có lỗi xảy ra' },
      { status: 500 }
    )
  }
} 