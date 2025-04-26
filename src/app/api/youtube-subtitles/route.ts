import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

// Proxy configuration
const PROXY_CONFIG = {
  enabled: process.env.USE_PROXY === 'true',
  host: process.env.PROXY_HOST || '38.153.152.244',
  port: process.env.PROXY_PORT || '9594',
};

// Configure YouTube Transcript with proxy
const configureYouTubeTranscript = () => {
  if (PROXY_CONFIG.enabled) {
    const proxyUrl = `http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`;
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    
    // Override the default fetch function with proxy
    const originalFetch = global.fetch;
    // @ts-ignore
    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      const options = {
        ...init,
        agent: proxyAgent,
      };
      // @ts-ignore
      return fetch(url.toString(), options);
    };
  }
};

export async function POST(req: Request) {
  try {
    const { videoUrl, useProxy } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    // Override proxy setting if specified in request
    if (useProxy !== undefined) {
      PROXY_CONFIG.enabled = useProxy;
    }

    // Configure proxy before fetching transcripts
    configureYouTubeTranscript();

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
      videoId,
      proxyUsed: PROXY_CONFIG.enabled
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