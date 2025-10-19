'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Download, ExternalLink, Image as ImageIcon, Info } from 'lucide-react';

interface SteamGame {
  appid: number;
  name: string;
  header_image: string;
  screenshots: string[];
  background: string;
  movies: string[];
  categories: string[];
  genres: string[];
  release_date: string;
  developer: string;
  publisher: string;
  description: string;
  totalImages?: number;
  totalMovies?: number;
}

export default function SteamAssets() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [game, setGame] = useState<SteamGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Extract app ID from Steam URL
  const extractAppId = (steamUrl: string): number | null => {
    const patterns = [
      /steamcommunity\.com\/app\/(\d+)/,
      /store\.steampowered\.com\/app\/(\d+)/,
      /steam\.com\/app\/(\d+)/,
      /app\/(\d+)/,
      /(\d+)/ // Fallback for direct app ID
    ];

    for (const pattern of patterns) {
      const match = steamUrl.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return null;
  };

  // Fetch game data from Steam API
  const fetchGameData = async (appId: number): Promise<SteamGame> => {
    try {
      // Use our API route instead of direct Steam API call
      const response = await fetch(`/api/steam?appId=${appId}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data[appId]?.success) {
        throw new Error('Không tìm thấy thông tin game');
      }

      const gameData = data[appId].data;
      
      return {
        appid: appId,
        name: gameData.name,
        header_image: gameData.header_image,
        screenshots: data.screenshots || [],
        background: gameData.background,
        movies: data.movies || [],
        categories: gameData.categories?.map((cat: any) => cat.description) || [],
        genres: gameData.genres?.map((genre: any) => genre.description) || [],
        release_date: gameData.release_date?.date || 'Không rõ',
        developer: gameData.developers?.join(', ') || 'Không rõ',
        publisher: gameData.publishers?.join(', ') || 'Không rõ',
        description: gameData.detailed_description || ''
      };
    } catch (error) {
      throw new Error('Không thể tải thông tin game từ Steam');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setProgress(0);
    setGame(null);

    try {
      const appId = extractAppId(url);
      if (!appId) {
        throw new Error('Không thể xác định App ID từ link Steam');
      }

      setProgress(30);
      const gameData = await fetchGameData(appId);
      setProgress(100);
      setGame(gameData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = () => {
    if (!game) return;
    
    // Download header image
    if (game.header_image) {
      downloadImage(game.header_image, `${game.name}_header.jpg`);
    }
    
    // Download screenshots
    game.screenshots.forEach((screenshot, index) => {
      setTimeout(() => {
        downloadImage(screenshot, `${game.name}_screenshot_${index + 1}.jpg`);
      }, index * 500); // Delay to avoid browser blocking
    });
  };

  // Categorize images by type
  const categorizeImages = (images: string[]) => {
    const categories = {
      header: [] as string[],
      screenshots: [] as string[],
      achievements: [] as string[],
      workshop: [] as string[],
      community: [] as string[],
      library: [] as string[],
      other: [] as string[]
    };

    images.forEach(img => {
      if (img.includes('/header.')) {
        categories.header.push(img);
      } else if (img.includes('/ss_')) {
        categories.screenshots.push(img);
      } else if (img.includes('/achievements/')) {
        categories.achievements.push(img);
      } else if (img.includes('/workshop/')) {
        categories.workshop.push(img);
      } else if (img.includes('/community/')) {
        categories.community.push(img);
      } else if (img.includes('/library_')) {
        categories.library.push(img);
      } else {
        categories.other.push(img);
      }
    });

    return categories;
  };

  const imageCategories = game ? categorizeImages(game.screenshots) : null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            Tải tài nguyên từ Steam
          </CardTitle>
          <CardDescription>
            Nhập link game Steam để tải tất cả ảnh, screenshot và video của game đó
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Nhập link game Steam (ví dụ: https://store.steampowered.com/app/730/CounterStrike_2/)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !url.trim()}>
                {loading ? 'Đang tải...' : 'Tìm kiếm'}
              </Button>
            </div>
            
            {loading && <Progress value={progress} className="w-full" />}
            
            {error && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {game && (
        <div className="space-y-6">
          {/* Game Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{game.name}</CardTitle>
                  <CardDescription className="mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><strong>Developer:</strong> {game.developer}</div>
                      <div><strong>Publisher:</strong> {game.publisher}</div>
                      <div><strong>Release Date:</strong> {game.release_date}</div>
                      <div><strong>App ID:</strong> {game.appid}</div>
                    </div>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://store.steampowered.com/app/${game.appid}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Xem trên Steam
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Header Image */}
          {game.header_image && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ảnh bìa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative group">
                  <img
                    src={game.header_image}
                    alt={`${game.name} header`}
                    className="w-full max-w-2xl rounded-lg shadow-lg"
                  />
                  <Button
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => downloadImage(game.header_image, `${game.name}_header.jpg`)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Screenshots */}
          {game.screenshots.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Tất cả ảnh ({game.totalImages || game.screenshots.length})
                  </CardTitle>
                  <Button onClick={downloadAllImages} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Tải tất cả
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Image Categories */}
                {imageCategories && (
                  <div className="mb-6 space-y-4">
                    {imageCategories.header.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-600 mb-2">Header Images ({imageCategories.header.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {imageCategories.header.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`${game.name} header ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-md"
                              />
                              <Button
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => downloadImage(img, `${game.name}_header_${index + 1}.jpg`)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {imageCategories.screenshots.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-600 mb-2">Screenshots ({imageCategories.screenshots.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {imageCategories.screenshots.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`${game.name} screenshot ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg shadow-md"
                              />
                              <Button
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => downloadImage(img, `${game.name}_screenshot_${index + 1}.jpg`)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {imageCategories.achievements.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-600 mb-2">Achievement Images ({imageCategories.achievements.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {imageCategories.achievements.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`${game.name} achievement ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg shadow-md"
                              />
                              <Button
                                size="sm"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => downloadImage(img, `${game.name}_achievement_${index + 1}.jpg`)}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {imageCategories.workshop.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-600 mb-2">Workshop Images ({imageCategories.workshop.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {imageCategories.workshop.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`${game.name} workshop ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-md"
                              />
                              <Button
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => downloadImage(img, `${game.name}_workshop_${index + 1}.jpg`)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {imageCategories.community.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-600 mb-2">Community Images ({imageCategories.community.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {imageCategories.community.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`${game.name} community ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-md"
                              />
                              <Button
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => downloadImage(img, `${game.name}_community_${index + 1}.jpg`)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {imageCategories.library.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-600 mb-2">Library Images ({imageCategories.library.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {imageCategories.library.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`${game.name} library ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-md"
                              />
                              <Button
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => downloadImage(img, `${game.name}_library_${index + 1}.jpg`)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {imageCategories.other.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-600 mb-2">Other Images ({imageCategories.other.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {imageCategories.other.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`${game.name} other ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-md"
                              />
                              <Button
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => downloadImage(img, `${game.name}_other_${index + 1}.jpg`)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Movies/Trailers */}
          {game.movies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Videos/Trailers ({game.movies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.movies.map((movie, index) => (
                    <div key={index} className="relative">
                      <video
                        controls
                        className="w-full rounded-lg shadow-md"
                        preload="metadata"
                      >
                        <source src={movie} type="video/webm" />
                        Your browser does not support the video tag.
                      </video>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => downloadImage(movie, `${game.name}_video_${index + 1}.webm`)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories & Genres */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {game.categories.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Categories:</h4>
                    <div className="flex flex-wrap gap-2">
                      {game.categories.map((category, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {game.genres.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Genres:</h4>
                    <div className="flex flex-wrap gap-2">
                      {game.genres.map((genre, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 