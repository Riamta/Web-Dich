'use client'

import { useEffect, useRef, useState } from 'react'
import { Cloud, Thermometer, Wind, MapPin, Search, Droplets, CloudRain } from 'lucide-react'

interface WeatherData {
    temperature: number
    windSpeed: number
    windDirection: number
    humidity: number
    precipitation: number
    clouds: {
        low: number
        mid: number
        high: number
    }
    pressure: number
    location: string
}

export default function Weather() {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchWeatherData = async (lat: number, lon: number) => {
        try {
            const response = await fetch('https://api.windy.com/api/point-forecast/v2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lat,
                    lon,
                    model: 'gfs',
                    parameters: [
                        'temp', 
                        'wind',
                        'rh',
                        'precip',
                        'pressure',
                        'lclouds',
                        'mclouds',
                        'hclouds'
                    ],
                    levels: ['surface'],
                    key: process.env.NEXT_PUBLIC_WINDY_API_KEY
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }

            const data = await response.json();
            
            // Get the first forecast point (current weather)
            const currentIndex = 0;
            
            // Parse wind components to get speed and direction
            const windU = data['wind_u-surface'][currentIndex];
            const windV = data['wind_v-surface'][currentIndex];
            const windSpeed = Math.sqrt(windU * windU + windV * windV);
            const windDirection = (Math.atan2(-windU, -windV) * 180 / Math.PI + 360) % 360;

            setWeatherData({
                temperature: data['temp-surface'][currentIndex],
                windSpeed: Number(windSpeed.toFixed(1)),
                windDirection: Number(windDirection.toFixed(1)),
                humidity: data['rh-surface'][currentIndex],
                precipitation: data['precip-surface'] ? data['precip-surface'][currentIndex] : 0,
                pressure: data['pressure-surface'][currentIndex],
                clouds: {
                    low: data['lclouds-surface'][currentIndex],
                    mid: data['mclouds-surface'][currentIndex],
                    high: data['hclouds-surface'][currentIndex]
                },
                location: searchQuery
            });
            setError(null);
        } catch (err) {
            console.error('Error fetching weather data:', err);
            setError('Không thể lấy dữ liệu thời tiết. Vui lòng thử lại sau.');
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        
        setLoading(true);
        try {
            // First, geocode the location to get coordinates
            const geocodeResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            );
            const geocodeData = await geocodeResponse.json();

            if (geocodeData && geocodeData[0]) {
                const { lat, lon } = geocodeData[0];
                await fetchWeatherData(Number(lat), Number(lon));
            } else {
                setError('Không tìm thấy địa điểm. Vui lòng thử lại với tên khác.');
            }
        } catch (err) {
            console.error('Error during search:', err);
            setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Dự báo thời tiết</h1>
            
            {/* Search Bar */}
            <div className="mb-8">
                <div className="relative max-w-md mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Nhập tên thành phố..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="block w-full rounded-lg border border-gray-200 pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="absolute inset-y-0 right-0 px-4 flex items-center bg-black text-white rounded-r-lg hover:bg-gray-800 disabled:bg-gray-400"
                    >
                        {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                    </button>
                </div>
                {error && (
                    <p className="text-red-500 text-sm text-center mt-2">{error}</p>
                )}
            </div>

            {/* Weather Info */}
            {weatherData && (
                <div className="mb-8 bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center mb-6">
                        <MapPin className="h-6 w-6 text-gray-500 mr-2" />
                        <h2 className="text-xl font-semibold">{weatherData.location}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <Thermometer className="h-8 w-8 text-red-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Nhiệt độ</p>
                                <p className="text-xl font-semibold">{weatherData.temperature.toFixed(1)}°C</p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <Wind className="h-8 w-8 text-blue-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Gió</p>
                                <p className="text-xl font-semibold">
                                    {weatherData.windSpeed} m/s
                                    <span className="text-sm text-gray-500 ml-1">
                                        ({weatherData.windDirection}°)
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <Droplets className="h-8 w-8 text-blue-400 mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Độ ẩm</p>
                                <p className="text-xl font-semibold">{weatherData.humidity.toFixed(0)}%</p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <CloudRain className="h-8 w-8 text-gray-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Lượng mưa (3h)</p>
                                <p className="text-xl font-semibold">{weatherData.precipitation.toFixed(1)} mm</p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <Cloud className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Mây</p>
                                <div>
                                    <p className="text-sm">Thấp: {weatherData.clouds.low}%</p>
                                    <p className="text-sm">Trung: {weatherData.clouds.mid}%</p>
                                    <p className="text-sm">Cao: {weatherData.clouds.high}%</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <svg className="h-8 w-8 text-gray-600 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm text-gray-500">Áp suất</p>
                                <p className="text-xl font-semibold">{weatherData.pressure.toFixed(0)} hPa</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 