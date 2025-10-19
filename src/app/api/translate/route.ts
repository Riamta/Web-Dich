import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, type = 'single' } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // For now, we'll simulate the translation since we can't directly run Python
    // In a real implementation, you would call a Python service or rewrite the logic in Node.js
    
    // This is a placeholder implementation
    const translatedText = `Translated: ${text}`;
    
    return NextResponse.json({ 
      translatedText,
      originalText: text 
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Handle file translation (placeholder)
    const translatedContent = `Translated content of ${file.name}`;
    
    return NextResponse.json({ 
      translatedContent,
      fileName: file.name 
    });
  } catch (error) {
    console.error('File translation error:', error);
    return NextResponse.json({ error: 'File translation failed' }, { status: 500 });
  }
}