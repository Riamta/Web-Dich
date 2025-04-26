import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Get transcripts
    const transcripts = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json({ error: 'No captions available for this video' }, { status: 404 });
    }

    return NextResponse.json({
      subtitles: transcripts,
      videoId
    });

  } catch (error: any) {
    console.error('Error fetching YouTube subtitles:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subtitles' },
      { status: 500 }
    );
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
} 