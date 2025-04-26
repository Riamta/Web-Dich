import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MdPlayCircleOutline } from 'react-icons/md';
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/youtube-util';

interface YouTubePreviewProps {
  videoId: string;
  className?: string;
}

export default function YouTubePreview({ videoId, className = '' }: YouTubePreviewProps) {
  const [videoInfo, setVideoInfo] = useState<{
    title: string;
    channelName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    if (!videoId) return;

    const fetchVideoInfo = async () => {
      try {
        setIsLoading(true);
        // In a real app, you would call an API to get video details
        // For this example, we'll just make a mock response
        // You could replace this with a call to your API
        setVideoInfo({
          title: 'YouTube Video',
          channelName: 'YouTube Channel',
        });
      } catch (err) {
        console.error('Error fetching video info:', err);
        setError('Failed to load video information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoInfo();
  }, [videoId]);

  if (!videoId) return null;
  
  if (error) {
    return (
      <div className={`bg-red-50 p-4 rounded-lg text-red-600 ${className}`}>
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-100 p-4 rounded-lg animate-pulse flex items-center justify-center h-[180px] ${className}`}>
        <span className="text-gray-500">Loading video information...</span>
      </div>
    );
  }

  if (showEmbed) {
    return (
      <div className={`relative pb-[56.25%] h-0 rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={getYouTubeEmbedUrl(videoId)}
          title={videoInfo?.title || 'YouTube Video'}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div 
      className={`bg-gray-100 rounded-lg overflow-hidden ${className}`}
      onClick={() => setShowEmbed(true)}
    >
      <div className="relative group cursor-pointer">
        <div className="relative w-full pb-[56.25%]">
          <Image
            src={getYouTubeThumbnailUrl(videoId)}
            alt={videoInfo?.title || 'YouTube Video Thumbnail'}
            className="object-cover"
            fill
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200">
            <MdPlayCircleOutline className="text-white text-5xl opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
          </div>
        </div>
        <div className="p-3 bg-white">
          <h3 className="font-medium text-gray-800 truncate">
            {videoInfo?.title || 'YouTube Video'}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {videoInfo?.channelName || 'YouTube Channel'}
          </p>
        </div>
      </div>
    </div>
  );
} 