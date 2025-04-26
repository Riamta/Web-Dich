'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

declare interface YT {
  Player: new (elementId: string, options: any) => any;
  PlayerState?: {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
  };
}

interface YouTubePlayerProps {
  videoId: string;
  currentSubtitle: string;
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export default function YouTubePlayer({ videoId, currentSubtitle, onTimeUpdate, onPlayStateChange }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const playerId = `youtube-player-${videoId}`;

  useEffect(() => {
    // Load YouTube IFrame API if not already loaded
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    const initPlayer = () => {
      if (!(window as any).YT) return;
      
      playerRef.current = new (window as any).YT.Player(playerId, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onStateChange: (event: any) => {
            const isPlaying = event.data === (window as any).YT.PlayerState.PLAYING;
            onPlayStateChange?.(isPlaying);
          },
          onReady: () => {
            // Start time update interval when player is ready
            const interval = setInterval(() => {
              if (playerRef.current?.getCurrentTime) {
                const currentTime = playerRef.current.getCurrentTime();
                onTimeUpdate?.(currentTime);
              }
            }, 100);

            // Clean up interval when component unmounts
            return () => clearInterval(interval);
          },
        },
      });
    };

    // If API is already loaded, initialize immediately
    if ((window as any).YT) {
      initPlayer();
    } else {
      // Otherwise wait for API to load
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  return (
    <div className="relative w-full">
      <div className="relative pb-[56.25%] h-0 bg-black rounded-lg overflow-hidden">
        <div id={playerId} className="absolute top-0 left-0 w-full h-full" />
      </div>
      {currentSubtitle && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50">
          <p className="text-center text-lg text-white">{currentSubtitle}</p>
        </div>
      )}
    </div>
  );
} 