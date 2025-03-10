import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(request: Request) {
  try {
    const { content, targetLanguage } = await request.json();

    if (!content || !targetLanguage) {
      return NextResponse.json(
        { error: 'SRT content and target language are required' },
        { status: 400 }
      );
    }

    try {
      console.log('📤 Processing SRT translation...');
      const translatedSRT = await aiService.translateSRT(content, targetLanguage);

      console.log('📥 Received translation:', {
        status: 'success',
        model: aiService.getModel(),
        targetLanguage
      });

      return NextResponse.json({ translation: translatedSRT });
    } catch (error) {
      console.error('❌ SRT translation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  } catch (error) {
    console.error('Error in translate-srt API:', error);
    return NextResponse.json(
      { error: 'Failed to translate SRT file' },
      { status: 500 }
    );
  }
} 