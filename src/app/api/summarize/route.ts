import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      console.log('📤 Sending request to Gemini...');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const generationConfig = {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192
      };

      const chatSession = geminiModel.startChat({
        generationConfig,
        history: []
      });

      const prompt = "Bạn là một trợ lý AI chuyên nghiệp trong việc tóm tắt văn bản. Hãy tóm tắt văn bản sau. Sau đó nêu ra các ý chính của văn bản.\n\n" + text;
      const result = await chatSession.sendMessage(prompt);
      const summary = result.response.text();

      console.log('📥 Received response from Gemini:', {
        status: 'success',
        model: 'gemini-2.0-flash',
        responseLength: summary.length
      });

      return NextResponse.json({ summary });
    } catch (error) {
      console.error('❌ Gemini summarization error:', {
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