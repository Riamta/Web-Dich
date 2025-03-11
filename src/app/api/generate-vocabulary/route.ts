import { NextResponse } from 'next/server'
import { aiService } from '@/lib/ai-service'

export async function POST(req: Request) {
  try {
    const { targetLanguage, topic, wordCount = 10 } = await req.json()

    // Validate word count
    const validWordCount = Math.max(1, Math.min(20, parseInt(String(wordCount)) || 10))

    const systemPrompt = `Bạn là một giáo viên ngôn ngữ chuyên nghiệp. Hãy tạo danh sách ${validWordCount} từ vựng ${
      topic === 'random' ? 'với chủ đề do bạn chọn' : `về chủ đề "${topic}"`
    } cho người học ${targetLanguage === 'en' ? 'tiếng Anh' : targetLanguage === 'zh' ? 'tiếng Trung' : targetLanguage === 'ja' ? 'tiếng Nhật' : 'tiếng Hàn'}.

Yêu cầu QUAN TRỌNG:
- Phải tạo CHÍNH XÁC ${validWordCount} từ vựng, không nhiều hơn, không ít hơn
- Mỗi từ vựng phải có đầy đủ các thông tin bên dưới
- Trả về đúng định dạng JSON được yêu cầu

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

Chú ý: 
- Chỉ trả về JSON thuần túy, không thêm markdown hoặc định dạng khác
- Đảm bảo đủ số lượng ${validWordCount} từ vựng theo yêu cầu`

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

    // Validate word count in response
    if (data.vocabulary.length !== validWordCount) {
      console.warn(`Expected ${validWordCount} words but got ${data.vocabulary.length}`)
      throw new Error(`AI đã tạo ${data.vocabulary.length} từ thay vì ${validWordCount} từ như yêu cầu. Vui lòng thử lại.`)
    }

    // Validate each vocabulary item
    data.vocabulary.forEach((item: any, index: number) => {
      if (!item.word || !item.pronunciation || !item.meaning || !item.example || !item.translation) {
        throw new Error(`Từ vựng thứ ${index + 1} thiếu thông tin. Vui lòng thử lại.`)
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Vocabulary generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Có lỗi xảy ra' },
      { status: 500 }
    )
  }
} 