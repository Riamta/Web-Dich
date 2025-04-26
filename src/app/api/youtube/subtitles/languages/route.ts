import { NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Missing videoId parameter' },
      { status: 400 }
    );
  }

  try {
    // Fetch the video page to extract available subtitle tracks
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
    const html = response.data;
    
    // Use cheerio to parse the HTML
    const $ = load(html);
    
    // Extract captions data from the page
    // YouTube stores this data in a script tag with JSON data
    let captionsData: any = {};
    let languages: Array<{code: string, name: string}> = [];
    
    // Try to find the player response data
    $('script').each((i, script) => {
      const scriptContent = $(script).html() || '';
      if (scriptContent.includes('captionTracks')) {
        // Extract the player response JSON
        const match = scriptContent.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (match && match[1]) {
          try {
            const playerResponse = JSON.parse(match[1]);
            
            // Extract caption tracks
            const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
            
            languages = captionTracks.map((track: any) => ({
              code: track.languageCode,
              name: track.name?.simpleText || track.languageCode
            }));
          } catch (e) {
            console.error('Error parsing player response:', e);
          }
        }
      }
    });
    
    // If we couldn't find any captions data, try an alternative method
    if (languages.length === 0) {
      // Fallback to hardcoded commonly available languages
      languages = [
        { code: 'en', name: 'English' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'es', name: 'Spanish' },
        { code: 'zh', name: 'Chinese' }
      ];
    }
    
    return NextResponse.json({ languages });
  } catch (error) {
    console.error('Error fetching YouTube captions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube captions' },
      { status: 500 }
    );
  }
} 