/**
 * Extracts YouTube video ID from a variety of YouTube URL formats
 * @param url The YouTube URL
 * @returns The video ID or null if not a valid YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle youtu.be format
  const youtubeShortRegex = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
  const shortMatch = url.match(youtubeShortRegex);
  if (shortMatch) return shortMatch[1];
  
  // Handle youtube.com/watch?v= format
  const youtubeStandardRegex = /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;
  const standardMatch = url.match(youtubeStandardRegex);
  if (standardMatch) return standardMatch[1];
  
  // Handle youtube.com/embed/ format
  const youtubeEmbedRegex = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;
  const embedMatch = url.match(youtubeEmbedRegex);
  if (embedMatch) return embedMatch[1];
  
  // Handle youtube.com/v/ format
  const youtubeVRegex = /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/;
  const vMatch = url.match(youtubeVRegex);
  if (vMatch) return vMatch[1];
  
  // Try a general regex for any other formats
  const generalRegex = /([a-zA-Z0-9_-]{11})/;
  const generalMatch = url.match(generalRegex);
  if (generalMatch && generalMatch[1].length === 11) return generalMatch[1];
  
  return null;
}

/**
 * Creates a YouTube embed URL from a video ID
 * @param videoId The YouTube video ID
 * @returns The embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Creates a YouTube thumbnail URL from a video ID
 * @param videoId The YouTube video ID
 * @param quality The thumbnail quality ('default', 'hqdefault', 'mqdefault', 'sddefault', 'maxresdefault')
 * @returns The thumbnail URL
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'hqdefault' | 'mqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
} 