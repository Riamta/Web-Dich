import { NextResponse } from 'next/server';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Function to convert timestamp to SRT format
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  const milliseconds = Math.floor((seconds - Math.floor(seconds)) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds)).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const lang = searchParams.get('lang') || 'en';

  if (!videoId) {
    return NextResponse.json(
      { error: 'Missing videoId parameter' },
      { status: 400 }
    );
  }

  try {
    // First, try to get the captions track URL
    const trackUrl = await getCaptionTrackUrl(videoId, lang);
    
    if (!trackUrl) {
      return NextResponse.json(
        { error: 'No captions found for this video in the requested language' },
        { status: 404 }
      );
    }

    // Fetch the caption track content
    const response = await axios.get(trackUrl);
    const xmlData = response.data;
    
    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: ""
    });
    const result = parser.parse(xmlData);
    
    // Convert to SRT format
    const captionArray = result.transcript.text;
    let srtContent = '';
    
    if (!captionArray || !Array.isArray(captionArray)) {
      return NextResponse.json(
        { error: 'Failed to parse captions' },
        { status: 500 }
      );
    }
    
    captionArray.forEach((caption: any, index: number) => {
      const startTime = parseFloat(caption.start);
      const duration = parseFloat(caption.dur || "2");
      const endTime = startTime + duration;
      
      // Format for SRT
      const startTimeFormatted = formatTime(startTime);
      const endTimeFormatted = formatTime(endTime);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTimeFormatted} --> ${endTimeFormatted}\n`;
      srtContent += `${caption["#text"] || ""}\n\n`;
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

// Function to get the caption track URL
async function getCaptionTrackUrl(videoId: string, languageCode: string): Promise<string | null> {
  try {
    // Fetch the video page
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
    const html = response.data;
    
    // Extract the caption track URL from the page - use dotAll instead of 's' flag
    const captionRegex = new RegExp(`"captionTracks":\\[.*?"languageCode":"${languageCode}".*?"baseUrl":"(.*?)"`, 'g');
    const match = captionRegex.exec(html.replace(/\n/g, ''));
    
    if (match && match[1]) {
      // The URL is escaped in the JSON
      return match[1].replace(/\\u0026/g, '&');
    }
    
    // Try with a more general regex if specific language not found
    const generalRegex = /"captionTracks":\[(.*?)\]/g;
    const generalMatch = generalRegex.exec(html.replace(/\n/g, ''));
    
    if (generalMatch && generalMatch[1]) {
      // Extract the first available caption track URL
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