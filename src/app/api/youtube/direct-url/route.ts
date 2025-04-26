import { NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const info = await ytdl.getInfo(videoId);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });

    return NextResponse.json({ url: format.url });
  } catch (error) {
    console.error('Error getting video URL:', error);
    return NextResponse.json({ error: 'Failed to get video URL' }, { status: 500 });
  }
} 