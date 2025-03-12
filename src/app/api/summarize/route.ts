import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(request: Request) {
  try {
    const { text, language } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    try {
      console.log('📤 Sending text for summarization...');
      const summary = await aiService.summarize(text, language);

      console.log('📥 Received summarization:', {
        status: 'success',
        model: aiService.getModel(),
        responseLength: summary.length
      });

      return NextResponse.json({ summary });
    } catch (error) {
      console.error('❌ Summarization error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  } catch (error) {
    console.error('Error in summarize API:', error);
    return NextResponse.json(
      { error: 'Failed to summarize text' },
      { status: 500 }
    );
  }
} 