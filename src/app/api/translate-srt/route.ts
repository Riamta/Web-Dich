import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

// Enable Edge Runtime with increased duration
export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes

// Split SRT content into smaller chunks
function splitSRTIntoChunks(content: string, maxChunkSize = 5): string[] {
  const blocks = content.trim().split(/\n\s*\n/);
  const chunks: string[] = [];
  
  for (let i = 0; i < blocks.length; i += maxChunkSize) {
    chunks.push(blocks.slice(i, i + maxChunkSize).join('\n\n'));
  }
  
  return chunks;
}

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
      console.log('📤 Processing SRT translation...', {
        contentLength: content.length,
        targetLanguage,
        timestamp: new Date().toISOString()
      });

      // Validate SRT format
      const blocks = content.trim().split(/\n\s*\n/);
      if (blocks.length === 0) {
        throw new Error('Invalid SRT format: No content blocks found');
      }

      // Process translation
      const translatedSRT = await aiService.translateSRT(content, targetLanguage);

      // Validate translation result
      if (!translatedSRT || typeof translatedSRT !== 'string') {
        throw new Error('Invalid translation result received from AI service');
      }

      // Validate translated SRT format
      const translatedBlocks = translatedSRT.trim().split(/\n\s*\n/);
      if (translatedBlocks.length === 0) {
        throw new Error('Invalid translation: No content blocks in result');
      }

      console.log('📥 Translation completed:', {
        status: 'success',
        model: aiService.getModel(),
        targetLanguage,
        originalBlocks: blocks.length,
        translatedBlocks: translatedBlocks.length,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ 
        translation: translatedSRT,
        metadata: {
          blocks: translatedBlocks.length,
          model: aiService.getModel(),
          language: targetLanguage
        }
      });

    } catch (error) {
      console.error('❌ SRT translation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  } catch (error) {
    console.error('Error in translate-srt API:', error);
    
    let errorMessage = 'Failed to translate SRT file';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 