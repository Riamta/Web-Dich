import { NextResponse } from 'next/server'
import { aiService } from '@/lib/ai-service'

export async function POST(req: Request) {
  try {
    const { targetLanguage, nativeLanguage = 'vi', topic, wordCount = 10 } = await req.json()

    // Validate word count
    const validWordCount = Math.max(1, Math.min(20, parseInt(String(wordCount)) || 10))

    const getLanguageName = (code: string) => {
      switch (code) {
        case 'en': return 'tiếng Anh'
        case 'zh': return 'tiếng Trung'
        case 'ja': return 'tiếng Nhật'
        case 'ko': return 'tiếng Hàn'
        case 'vi': return 'tiếng Việt'
        default: return code
      }
    }

    const systemPrompt = `Bạn là một giáo viên ngôn ngữ chuyên nghiệp. Hãy tạo danh sách ${validWordCount} từ vựng ${
      topic === 'random' ? 'với chủ đề do bạn chọn' : `về chủ đề "${topic}"`
    } cho người học ${getLanguageName(targetLanguage)}.

Yêu cầu QUAN TRỌNG:
- Phải tạo CHÍNH XÁC ${validWordCount} từ vựng, không nhiều hơn, không ít hơn
- Mỗi từ vựng phải có đầy đủ các thông tin bên dưới
- Trả về đúng định dạng JSON được yêu cầu
- Nghĩa của từ phải được dịch sang ${getLanguageName(nativeLanguage)}, ngắn gọn 1-3 từ, không giải thích dài dòng
- Câu ví dụ phải được dịch sang ${getLanguageName(nativeLanguage)}

Mỗi từ vựng cần có:
1. Từ gốc bằng ${getLanguageName(targetLanguage)}
2. Phiên âm (IPA cho tiếng Anh, Pinyin cho tiếng Trung, Hiragana/Katakana cho tiếng Nhật, Hangul cho tiếng Hàn)
3. Nghĩa bằng ${getLanguageName(nativeLanguage)} (ngắn gọn 1-3 từ)
4. Một câu ví dụ bằng ${getLanguageName(targetLanguage)}
5. Bản dịch câu ví dụ sang ${getLanguageName(nativeLanguage)}

Ví dụ về nghĩa ngắn gọn:
- "ambitious" -> "tham vọng" (thay vì "có tham vọng lớn, muốn thành công")
- "appreciate" -> "đánh giá cao" (thay vì "bày tỏ sự cảm kích, đánh giá cao")
- "determine" -> "xác định" (thay vì "quyết định hoặc xác định một điều gì đó")

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