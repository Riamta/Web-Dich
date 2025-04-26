'use client';

import { useState } from 'react';
import { useToast } from '@/utils/toast';
import { extractYouTubeVideoId } from '@/lib/youtube-util';
import YouTubePreview from '@/components/YouTubePreview';
import { MdVideoLibrary, MdDownload } from 'react-icons/md';

interface SubtitleLanguage {
  code: string;
  name: string;
}

export default function YouTubeSubtitleDownloader() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetchingSubtitles, setIsFetchingSubtitles] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fetchedLanguages, setFetchedLanguages] = useState<SubtitleLanguage[]>([]);
  const [subtitleLanguage, setSubtitleLanguage] = useState('en');
  const [videoId, setVideoId] = useState<string | null>(null);
  const { loading, success, error: showError, removeToast } = useToast();

  // Update videoId when youtubeUrl changes
  const handleUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const id = extractYouTubeVideoId(url);
    setVideoId(id);
  };

  // Fetch available subtitles for a YouTube video
  const fetchAvailableSubtitles = async (videoId: string) => {
    try {
      setIsFetchingSubtitles(true);
      const toastId = loading('Đang kiểm tra phụ đề có sẵn...');
      
      const response = await fetch(`/api/youtube/subtitles/languages?videoId=${videoId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available subtitles');
      }
      
      const data = await response.json();
      setFetchedLanguages(data.languages || []);
      
      if (data.languages && data.languages.length > 0) {
        // Find the index of currently selected language
        const selectedIndex = data.languages.findIndex((lang: SubtitleLanguage) => lang.code === subtitleLanguage);
        // Get the previous language code, if it's first language, use the last one
        const targetIndex = selectedIndex === 0 ? data.languages.length - 1 : selectedIndex - 1;
        setSubtitleLanguage(data.languages[targetIndex].code);
      }

      removeToast(toastId);
      success('Đã tìm thấy phụ đề');
    } catch (error: any) {
      console.error('Error fetching available subtitles:', error);
      showError('Không thể tìm thấy phụ đề. Vui lòng kiểm tra URL và thử lại.');
    } finally {
      setIsFetchingSubtitles(false);
    }
  };

  // Download subtitles from YouTube
  const handleDownload = async () => {
    if (!videoId) {
      showError('URL YouTube không hợp lệ. Vui lòng kiểm tra và thử lại.');
      return;
    }
    
    try {
      setIsDownloading(true);
      const toastId = loading('Đang tải phụ đề từ YouTube...');

      // Find the index of currently selected language
      const selectedIndex = fetchedLanguages.findIndex(lang => lang.code === subtitleLanguage);
      // Get the previous language code, if it's first language, use the last one
      const targetIndex = selectedIndex === 0 ? fetchedLanguages.length - 1 : selectedIndex - 1;
      const targetLanguage = fetchedLanguages[targetIndex].code;
      
      const response = await fetch(`/api/youtube/subtitles?videoId=${videoId}&lang=${targetLanguage}`);
      
      if (!response.ok) {
        throw new Error('Failed to download subtitles');
      }
      
      const data = await response.json();
      
      if (!data.content) {
        throw new Error('No subtitle content received');
      }
      
      // Create and download the SRT file
      const blob = new Blob([data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use the selected language code for the file name
      a.download = `youtube_${videoId}_${subtitleLanguage}.srt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      removeToast(toastId);
      success('Đã tải phụ đề thành công');
    } catch (error: any) {
      console.error('Error downloading subtitles:', error);
      showError('Không thể tải phụ đề. Vui lòng thử lại sau.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4">
          {/* YouTube Subtitle Section */}
          <div className="flex flex-col gap-4">
            <div className="flex-1 flex items-center gap-4">
              <div className="flex items-center">
                <MdVideoLibrary className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm font-medium">Tải phụ đề từ YouTube:</span>
              </div>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Nhập URL video YouTube"
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
              {fetchedLanguages.length > 0 && (
                <select
                  value={subtitleLanguage}
                  onChange={(e) => setSubtitleLanguage(e.target.value)}
                  className="w-48 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                >
                  {fetchedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              )}
              {fetchedLanguages.length === 0 ? (
                <button
                  onClick={() => videoId && fetchAvailableSubtitles(videoId)}
                  disabled={isFetchingSubtitles || !youtubeUrl || !videoId}
                  className={`py-2 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 ${
                    isFetchingSubtitles || !youtubeUrl || !videoId
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isFetchingSubtitles ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Đang kiểm tra...
                    </span>
                  ) : (
                    'Kiểm tra phụ đề'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading || isFetchingSubtitles}
                  className={`py-2 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 ${
                    isDownloading || isFetchingSubtitles
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isDownloading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Đang tải...
                    </span>
                  ) : (
                    <>
                      <MdDownload className="h-5 w-5" />
                      Tải phụ đề
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* YouTube video preview */}
            {videoId && (
              <div className="mt-2">
                <YouTubePreview videoId={videoId} className="max-w-md" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 