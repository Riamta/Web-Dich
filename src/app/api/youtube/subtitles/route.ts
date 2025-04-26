import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Function to convert timestamp to SRT format
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  const milliseconds = Math.floor((seconds - Math.floor(seconds)) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds)).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

// Simple XML parser for transcript format
function parseTranscript(xmlStr: string) {
  const texts: { start: number; dur: number; text: string }[] = [];
  const regex = /<text start="([\d.]+)" dur="([\d.]+)".*?>(.*?)<\/text>/g;
  let match;

  while ((match = regex.exec(xmlStr)) !== null) {
    texts.push({
      start: parseFloat(match[1]),
      dur: parseFloat(match[2]),
      text: decodeURIComponent(match[3].replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>'))
    });
  }

  return texts;
}

async function getCaptionTrackUrl(videoId: string, languageCode: string): Promise<string | null> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    // Extract the caption track URL from the page
    const captionRegex = new RegExp(`"captionTracks":\\[.*?"languageCode":"${languageCode}".*?"baseUrl":"(.*?)"`, 'g');
    const match = captionRegex.exec(html.replace(/\n/g, ''));
    
    if (match && match[1]) {
      return match[1].replace(/\\u0026/g, '&');
    }
    
    // Try with a more general regex if specific language not found
    const generalRegex = /"captionTracks":\[(.*?)\]/g;
    const generalMatch = generalRegex.exec(html.replace(/\n/g, ''));
    
    if (generalMatch && generalMatch[1]) {
      const urlMatch = generalMatch[1].match(/"baseUrl":"(.*?)"/);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1].replace(/\\u0026/g, '&');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting caption track URL:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId');
  const lang = request.nextUrl.searchParams.get('lang') || 'en';

  if (!videoId) {
    return NextResponse.json(
      { error: 'Missing videoId parameter' },
      { status: 400 }
    );
  }

  try {
    // Get the captions track URL
    const trackUrl = await getCaptionTrackUrl(videoId, lang);
    
    if (!trackUrl) {
      return NextResponse.json(
        { error: 'No captions found for this video in the requested language' },
        { status: 404 }
      );
    }

    // Fetch the caption track content
    const response = await fetch(trackUrl);
    const xmlData = await response.text();
    
    // Parse XML and convert to array of captions
    const captionArray = parseTranscript(xmlData);
    
    if (!captionArray || captionArray.length === 0) {
      return NextResponse.json(
        { error: 'Failed to parse captions' },
        { status: 500 }
      );
    }
    
    // Convert to SRT format
    let srtContent = '';
    captionArray.forEach((caption, index) => {
      const startTime = caption.start;
      const endTime = startTime + caption.dur;
      
      // Format for SRT
      const startTimeFormatted = formatTime(startTime);
      const endTimeFormatted = formatTime(endTime);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTimeFormatted} --> ${endTimeFormatted}\n`;
      srtContent += `${caption.text}\n\n`;
    });
    
    return NextResponse.json({ content: srtContent });
  } catch (error) {
    console.error('Error fetching YouTube captions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube captions' },
      { status: 500 }
    );
  }
} 