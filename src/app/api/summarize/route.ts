import { NextResponse } from 'next/server';
import { summarizeService } from '@/lib/summarize-service';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    console.log('📥 Received request with content-type:', contentType);
    
    const data = await request.json();
    
    if (data.files) {
      // Handle files (base64 data)
      const files = data.files;
      const language = data.language;
      const type = data.type;

      console.log('📥 Files data:', {
        fileCount: files.length,
        fileTypes: files.map(f => f.type),
        fileNames: files.map(f => f.name),
        language,
        type
      });

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: 'Files are required' },
          { status: 400 }
        );
      }

      try {
        console.log('📤 Sending files for summarization...', { 
          fileCount: files.length,
          types: files.map(f => f.type),
          type 
        });

        const summaries = await summarizeService.summarizeFiles(files, {
          language,
          type,
          preserveContext: true,
          useFormat: true,
          useMarkdown: true
        });

        console.log('📥 Received file summarization:', {
          status: 'success',
          fileCount: summaries.length,
          type
        });

        return NextResponse.json({ summaries });
      } catch (error) {
        console.error('❌ File summarization error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    } else if (data.text) {
      // Handle text
      const { text, language, type } = data;

      if (!text) {
        return NextResponse.json(
          { error: 'Text is required' },
          { status: 400 }
        );
      }

      try {
        console.log('📤 Sending text for summarization...', { type });
        const summary = await summarizeService.summarize(text, language, type);

        console.log('📥 Received text summarization:', {
          status: 'success',
          responseLength: summary.length,
          type
        });

        return NextResponse.json({ summary });
      } catch (error) {
        console.error('❌ Text summarization error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    } else {
      return NextResponse.json(
        { error: 'Either text or files are required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in summarize API:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: 'Failed to summarize content' },
      { status: 500 }
    );
  }
} 