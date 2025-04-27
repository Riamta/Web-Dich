'use client'

import { useEffect, useState, useRef } from 'react'
import { CloudIcon, BeakerIcon, ArrowDownIcon, MapPinIcon, MagnifyingGlassIcon, CloudIcon as CloudIconSolid, CloudArrowDownIcon, SunIcon, ArrowsRightLeftIcon, ArrowLeftIcon, ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline'

interface WeatherData {
    current: {
        time: string
        temperature: number
        relativeHumidity: number
        apparentTemperature: number
        precipitation: number
        weatherCode: number
        windSpeed: number
        windDirection: number
        isDay: number
        uvIndex: number
        visibility: number
        cloudCover: number
        dewPoint: number
    }
    daily: {
        time: string[]
        weatherCode: number[]
        temperatureMax: number[]
        temperatureMin: number[]
        sunrise: string[]
        sunset: string[]
        precipitationProbabilityMax: number[]
        windSpeedMax: number[]
        uvIndexMax: number[]
        rainSum: number[]
        snowfallSum: number[]
        precipitationHours: number[]
        windGusts: number[]
    }
    hourly: {
        time: string[]
        temperature: number[]
        precipitation: number[]
        weatherCode: number[]
        cloudCover: number[]
        windSpeed: number[]
        relativeHumidity: number[]
    }
    location: string
}

// WMO Weather interpretation codes
const weatherCodes: { [key: number]: { icon: string, description: string } } = {
    0: { icon: '☀️', description: 'Trời quang đãng' },
    1: { icon: '🌤️', description: 'Chủ yếu quang đãng' },
    2: { icon: '⛅', description: 'Có mây rải rác' },
    3: { icon: '☁️', description: 'Nhiều mây' },
    45: { icon: '🌫️', description: 'Có sương mù' },
    48: { icon: '🌫️', description: 'Có sương mù giá' },
    51: { icon: '🌧️', description: 'Mưa phùn nhẹ' },
    53: { icon: '🌧️', description: 'Mưa phùn vừa' },
    55: { icon: '🌧️', description: 'Mưa phùn mạnh' },
    61: { icon: '🌧️', description: 'Mưa nhỏ' },
    63: { icon: '🌧️', description: 'Mưa vừa' },
    65: { icon: '🌧️', description: 'Mưa to' },
    66: { icon: '🌧️', description: 'Mưa băng giá nhẹ' },
    67: { icon: '🌧️', description: 'Mưa băng giá mạnh' },
    71: { icon: '🌨️', description: 'Tuyết rơi nhẹ' },
    73: { icon: '🌨️', description: 'Tuyết rơi vừa' },
    75: { icon: '🌨️', description: 'Tuyết rơi mạnh' },
    77: { icon: '🌨️', description: 'Hạt tuyết' },
    80: { icon: '🌦️', description: 'Mưa rào nhẹ' },
    81: { icon: '🌦️', description: 'Mưa rào vừa' },
    82: { icon: '🌦️', description: 'Mưa rào mạnh' },
    85: { icon: '🌨️', description: 'Mưa tuyết nhẹ' },
    86: { icon: '🌨️', description: 'Mưa tuyết mạnh' },
    95: { icon: '⛈️', description: 'Giông bão' },
    96: { icon: '⛈️', description: 'Giông bão và mưa đá nhẹ' },
    99: { icon: '⛈️', description: 'Giông bão và mưa đá mạnh' }
};

interface SavedLocation {
    name: string
    latitude: number
    longitude: number
    timestamp: number
}

export default function Weather() {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [gettingLocation, setGettingLocation] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const hourlyContainerRef = useRef<HTMLDivElement>(null)
    const currentHourRef = useRef<HTMLDivElement>(null)
    const [refreshing, setRefreshing] = useState(false)
    const pageRef = useRef<HTMLDivElement>(null)
    const swipeStartY = useRef<number | null>(null)
    const pullDistance = useRef<number>(0)
    const isPulling = useRef<boolean>(false)

    const DEFAULT_CITY = 'Hà Nội'
    const DEFAULT_COORDS = { latitude: 21.0285, longitude: 105.8542 }
    const STORAGE_KEY = 'lastWeatherLocation'
    const LOCATION_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    const saveLocationToStorage = (name: string, latitude: number, longitude: number) => {
        const locationData: SavedLocation = {
            name,
            latitude,
            longitude,
            timestamp: Date.now()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(locationData))
    }

    const getStoredLocation = (): SavedLocation | null => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (!stored) return null

            const locationData: SavedLocation = JSON.parse(stored)
            const isExpired = Date.now() - locationData.timestamp > LOCATION_EXPIRY

            if (isExpired) {
                localStorage.removeItem(STORAGE_KEY)
                return null
            }

            return locationData
        } catch (err) {
            console.error('Error reading from localStorage:', err)
            return null
        }
    }

    const fetchWeatherData = async (lat: number, lon: number) => {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weathercode,` +
                `windspeed_10m,winddirection_10m,is_day,uv_index,visibility,cloud_cover,dew_point_2m` +
                `&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,` +
                `windspeed_10m_max,uv_index_max,rain_sum,snowfall_sum,precipitation_hours,wind_gusts_10m_max` +
                `&hourly=temperature_2m,precipitation,weathercode,cloud_cover,windspeed_10m,relative_humidity_2m` +
                `&timezone=auto&forecast_days=7`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }

            const data = await response.json();
            
            setWeatherData({
                current: {
                    time: data.current.time,
                    temperature: data.current.temperature_2m,
                    relativeHumidity: data.current.relative_humidity_2m,
                    apparentTemperature: data.current.apparent_temperature,
                    precipitation: data.current.precipitation,
                    weatherCode: data.current.weathercode,
                    windSpeed: data.current.windspeed_10m,
                    windDirection: data.current.winddirection_10m,
                    isDay: data.current.is_day,
                    uvIndex: data.current.uv_index,
                    visibility: data.current.visibility,
                    cloudCover: data.current.cloud_cover,
                    dewPoint: data.current.dew_point_2m
                },
                daily: {
                    time: data.daily.time,
                    weatherCode: data.daily.weathercode,
                    temperatureMax: data.daily.temperature_2m_max,
                    temperatureMin: data.daily.temperature_2m_min,
                    sunrise: data.daily.sunrise,
                    sunset: data.daily.sunset,
                    precipitationProbabilityMax: data.daily.precipitation_probability_max,
                    windSpeedMax: data.daily.windspeed_10m_max,
                    uvIndexMax: data.daily.uv_index_max,
                    rainSum: data.daily.rain_sum,
                    snowfallSum: data.daily.snowfall_sum,
                    precipitationHours: data.daily.precipitation_hours,
                    windGusts: data.daily.wind_gusts_10m_max
                },
                hourly: {
                    time: data.hourly.time,
                    temperature: data.hourly.temperature_2m,
                    precipitation: data.hourly.precipitation,
                    weatherCode: data.hourly.weathercode,
                    cloudCover: data.hourly.cloud_cover,
                    windSpeed: data.hourly.windspeed_10m,
                    relativeHumidity: data.hourly.relative_humidity_2m
                },
                location: searchQuery
            });
            setError(null);

            if (searchQuery) {
                saveLocationToStorage(searchQuery, lat, lon)
            }
        } catch (err) {
            console.error('Error fetching weather data:', err);
            setError('Không thể lấy dữ liệu thời tiết. Vui lòng thử lại sau.');
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        
        setLoading(true);
        try {
            const geocodeResponse = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=vi`
            );
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.results?.[0]) {
                const { latitude, longitude, name } = geocodeData.results[0];
                setSearchQuery(name); // Update with official name
                await fetchWeatherData(latitude, longitude);
            } else {
                setError('Không tìm thấy địa điểm. Vui lòng thử lại với tên khác.');
            }
        } catch (err) {
            console.error('Error during search:', err);
            setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }

    const searchDefaultCity = async () => {
        setSearchQuery(DEFAULT_CITY);
        await fetchWeatherData(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude);
    }

    const getCurrentLocation = () => {
        setGettingLocation(true)
        setError(null)

        if (!navigator.geolocation) {
            setError('Trình duyệt của bạn không hỗ trợ định vị. Đang hiển thị thời tiết tại Hà Nội.')
            setGettingLocation(false)
            searchDefaultCity()
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords
                    
                    // Reverse geocoding to get location name
                    const geocodeResponse = await fetch(
                        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=vi`
                    )
                    const geocodeData = await geocodeResponse.json()
                    
                    if (geocodeData.results?.[0]) {
                        setSearchQuery(geocodeData.results[0].name)
                        await fetchWeatherData(latitude, longitude)
                    } else {
                        setError('Không thể xác định tên địa điểm. Đang hiển thị thời tiết tại Hà Nội.')
                        searchDefaultCity()
                    }
                } catch (err) {
                    console.error('Error getting location:', err)
                    setError('Có lỗi xảy ra khi lấy thông tin vị trí. Đang hiển thị thời tiết tại Hà Nội.')
                    searchDefaultCity()
                } finally {
                    setGettingLocation(false)
                }
            },
            (err) => {
                console.error('Geolocation error:', err)
                setError('Không thể lấy vị trí của bạn. Đang hiển thị thời tiết tại Hà Nội.')
                setGettingLocation(false)
                searchDefaultCity()
            },
            { timeout: 5000 }
        )
    }

    // Try to load last location first, then try geolocation
    useEffect(() => {
        const storedLocation = getStoredLocation()
        
        if (storedLocation) {
            setSearchQuery(storedLocation.name)
            fetchWeatherData(storedLocation.latitude, storedLocation.longitude)
        } else {
            getCurrentLocation()
        }
    }, [])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Hàm để kiểm tra xem một ngày có phải là ngày được chọn không
    const isSelectedDay = (date: string) => {
        if (!selectedDate) return false;
        return new Date(date).toDateString() === new Date(selectedDate).toDateString();
    }

    // Hàm để lấy các giờ trong ngày được chọn
    const getHourlyDataForDay = (date: string) => {
        if (!weatherData?.hourly) return [];
        
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        return weatherData.hourly.time.reduce((acc: number[], time, index) => {
            const currentTime = new Date(time);
            if (currentTime >= startOfDay && currentTime <= endOfDay) {
                acc.push(index);
            }
            return acc;
        }, []);
    }

    const isCurrentHour = (timeString: string) => {
        const now = new Date()
        const time = new Date(timeString)
        return now.getHours() === time.getHours() && 
               now.getDate() === time.getDate() &&
               now.getMonth() === time.getMonth() &&
               now.getFullYear() === time.getFullYear()
    }

    const getCurrentHourIndex = () => {
        if (!weatherData?.hourly) return -1;
        return weatherData.hourly.time.findIndex(time => isCurrentHour(time));
    }

    const scrollToCurrentHour = () => {
        if (!hourlyContainerRef.current || !currentHourRef.current) return;

        const container = hourlyContainerRef.current;
        const currentHourElement = currentHourRef.current;

        // Tính toán vị trí để giờ hiện tại nằm giữa container
        const scrollPosition = currentHourElement.offsetLeft - 
            (container.clientWidth / 2) + 
            (currentHourElement.clientWidth / 2);

        container.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: 'smooth'
        });
    };

    // Tự động cuộn đến giờ hiện tại khi dữ liệu được tải
    useEffect(() => {
        if (weatherData && !selectedDate) {
            scrollToCurrentHour();
        }
    }, [weatherData, selectedDate]);

    const refreshWeather = async () => {
        setRefreshing(true)
        try {
            const storedLocation = getStoredLocation()
            
            if (storedLocation) {
                await fetchWeatherData(storedLocation.latitude, storedLocation.longitude)
            } else {
                await getCurrentLocation()
            }
        } finally {
            setRefreshing(false)
        }
    }

    // Handle horizontal touch scrolling manually for improved mobile experience
    useEffect(() => {
        const container = hourlyContainerRef.current
        if (!container) return
        
        let startX: number
        let scrollLeft: number
        
        const onTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].pageX - container.offsetLeft
            scrollLeft = container.scrollLeft
        }
        
        const onTouchMove = (e: TouchEvent) => {
            if (!startX) return
            const x = e.touches[0].pageX - container.offsetLeft
            const walk = (x - startX) * 1.5 // Scroll speed multiplier
            container.scrollLeft = scrollLeft - walk
        }
        
        container.addEventListener('touchstart', onTouchStart)
        container.addEventListener('touchmove', onTouchMove)
        
        return () => {
            container.removeEventListener('touchstart', onTouchStart)
            container.removeEventListener('touchmove', onTouchMove)
        }
    }, [weatherData])

    // Implement a simple pull-to-refresh
    useEffect(() => {
        const page = pageRef.current
        if (!page) return
        
        const onTouchStart = (e: TouchEvent) => {
            // Only enable pull-to-refresh at the top of the page
            if (window.scrollY <= 10) {
                swipeStartY.current = e.touches[0].clientY
                isPulling.current = true
                pullDistance.current = 0
            }
        }
        
        const onTouchMove = (e: TouchEvent) => {
            if (!isPulling.current || swipeStartY.current === null) return
            
            const currentY = e.touches[0].clientY
            const diff = currentY - swipeStartY.current
            
            // Only handle pull-down gesture
            if (diff > 0 && window.scrollY <= 0) {
                pullDistance.current = Math.min(80, diff) // Limit max pull distance
                
                // Visual feedback for pull - add a loading indicator
                if (pullDistance.current > 60 && !refreshing) {
                    // Show visual cue that release will refresh
                    document.body.style.setProperty('--pull-indicator-opacity', '1')
                } else {
                    document.body.style.setProperty('--pull-indicator-opacity', '0.5')
                }
                
                document.body.style.setProperty('--pull-distance', `${pullDistance.current}px`)
            }
        }
        
        const onTouchEnd = () => {
            if (isPulling.current && pullDistance.current > 60 && !refreshing) {
                refreshWeather()
            }
            
            isPulling.current = false
            swipeStartY.current = null
            pullDistance.current = 0
            document.body.style.setProperty('--pull-distance', '0px')
            document.body.style.setProperty('--pull-indicator-opacity', '0')
        }
        
        page.addEventListener('touchstart', onTouchStart)
        page.addEventListener('touchmove', onTouchMove)
        page.addEventListener('touchend', onTouchEnd)
        
        return () => {
            page.removeEventListener('touchstart', onTouchStart)
            page.removeEventListener('touchmove', onTouchMove)
            page.removeEventListener('touchend', onTouchEnd)
        }
    }, [refreshing])

    return (
        <div ref={pageRef} className="mx-auto px-2 py-8 max-w-7xl">
            {/* Pull-to-refresh indicator */}
            <div className="pull-to-refresh-indicator">
                <div className="pull-to-refresh-spinner"></div>
                <span>Kéo để làm mới</span>
            </div>
            
            {/* Sticky Header for Mobile */}
            <div className="sticky top-0 z-10 px-2 pb-2 shadow-sm sm:shadow-none mb-2 sm:mb-0 w-full">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl sm:text-3xl font-bold mb-0 sm:mb-4">Dự báo thời tiết</h1>
                    
                    <button 
                        onClick={refreshWeather} 
                        disabled={refreshing || loading || gettingLocation}
                        className="sm:hidden p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
                        aria-label="Làm mới dữ liệu thời tiết"
                    >
                        <ArrowsRightLeftIcon className={`${refreshing ? 'animate-spin' : ''} w-5 h-5`} />
                    </button>
                </div>
            </div>
            
            {/* Search Bar - Tối ưu cho mobile */}
            <div className="mb-4 px-2 w-full">
                <div className="relative w-full mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Nhập tên thành phố..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="block w-full rounded-lg border border-gray-200 pl-8 sm:pl-10 pr-20 sm:pr-24 py-2 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 right-0 flex">
                        <button
                            onClick={getCurrentLocation}
                            disabled={gettingLocation}
                            className="px-2 sm:px-3 flex items-center text-gray-600 hover:text-black border-l border-gray-200"
                            title="Lấy vị trí hiện tại"
                        >
                            {gettingLocation ? (
                                <ArrowsRightLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            ) : (
                                <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                        </button>
                        <button
                            onClick={handleSearch}
                            disabled={loading || gettingLocation}
                            className="px-3 sm:px-4 flex items-center bg-black text-white text-sm rounded-r-lg hover:bg-gray-800 disabled:bg-gray-400"
                        >
                            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-xs sm:text-sm text-center">{error}</p>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {(loading || gettingLocation) && !weatherData && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="relative">
                        <ArrowsRightLeftIcon className="h-10 w-10 text-gray-400 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-6 w-6 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">{gettingLocation ? 'Đang lấy vị trí...' : 'Đang tải dữ liệu thời tiết...'}</p>
                </div>
            )}

            {weatherData && (
                <div className="px-2 w-full">
                    {/* Current Weather Card */}
                    <div className="mb-4 bg-white rounded-lg shadow p-3 sm:p-6 w-full box-border">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                            <div className="flex items-center">
                                <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 mr-2 flex-shrink-0" />
                                <h2 className="text-lg sm:text-xl font-semibold truncate max-w-[calc(100vw-120px)] sm:max-w-none">{weatherData.location}</h2>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center">
                                    <SunIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mr-1" />
                                    <span>{formatTime(weatherData.daily.sunrise[0])}</span>
                                </div>
                                <div className="flex items-center">
                                    <SunIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mr-1" />
                                    <span>{formatTime(weatherData.daily.sunset[0])}</span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile view */}
                        <div className="sm:hidden w-full">
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg mb-2 w-full">
                                <div className="flex-shrink-0 mr-3 text-3xl">
                                    {weatherCodes[weatherData.current.weatherCode]?.icon}
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">
                                        {weatherData.current.temperature.toFixed(1)}°C
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {weatherCodes[weatherData.current.weatherCode]?.description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Cảm giác như {weatherData.current.apparentTemperature.toFixed(1)}°C
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <ArrowDownIcon className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500">Gió</p>
                                            <p className="text-sm font-semibold">
                                                {weatherData.current.windSpeed.toFixed(1)} km/h
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <CloudIconSolid className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500">Độ ẩm</p>
                                            <p className="text-sm font-semibold">
                                                {weatherData.current.relativeHumidity}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop view */}
                        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div className="col-span-2 lg:col-span-1 flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0 mr-3 sm:mr-4 text-3xl sm:text-4xl">
                                    {weatherCodes[weatherData.current.weatherCode]?.icon}
                                </div>
                                <div>
                                    <p className="text-lg sm:text-xl font-semibold">
                                        {weatherData.current.temperature.toFixed(1)}°C
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500 capitalize">
                                        {weatherCodes[weatherData.current.weatherCode]?.description}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        Cảm giác như {weatherData.current.apparentTemperature.toFixed(1)}°C
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <ArrowDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mr-2" />
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500">Gió</p>
                                        <p className="text-sm sm:text-base font-semibold">
                                            {weatherData.current.windSpeed.toFixed(1)} km/h
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Hướng: {weatherData.current.windDirection}°
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <CloudIconSolid className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mr-2" />
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500">Độ ẩm</p>
                                        <p className="text-sm sm:text-base font-semibold">
                                            {weatherData.current.relativeHumidity}%
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Điểm sương: {weatherData.current.dewPoint.toFixed(1)}°C
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hourly Forecast */}
                    <div className="mb-4 bg-white rounded-lg shadow p-3 sm:p-6 w-full box-border">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                            <h3 className="text-base sm:text-lg font-semibold">
                                {selectedDate 
                                    ? `Dự báo theo giờ - ${formatDate(selectedDate)}`
                                    : 'Dự báo 24 giờ tới'}
                            </h3>
                            <div className="flex items-center gap-2">
                                {!selectedDate && getCurrentHourIndex() !== -1 && (
                                    <button
                                        onClick={scrollToCurrentHour}
                                        className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                                        title="Cuộn đến giờ hiện tại"
                                    >
                                        <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        Hiện tại
                                    </button>
                                )}
                                {selectedDate && (
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Quay lại 24 giờ tới
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="relative">
                            <div 
                                ref={hourlyContainerRef}
                                className="overflow-x-auto scroll-smooth hide-scrollbar py-[10px] w-full"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                                <div className="flex space-x-2 sm:space-x-4 min-w-max">
                                    {(selectedDate 
                                        ? getHourlyDataForDay(selectedDate)
                                        : Array.from({ length: 24 }, (_, i) => i)
                                    ).map((index) => {
                                        const timeString = weatherData.hourly.time[index];
                                        const isCurrent = !selectedDate && isCurrentHour(timeString);
                                        
                                        return (
                                            <div 
                                                key={timeString} 
                                                ref={isCurrent ? currentHourRef : null}
                                                className={`flex-none w-[65px] sm:w-32 p-2 sm:p-4 rounded-lg transition-all ${
                                                    isCurrent 
                                                        ? 'bg-blue-50 ring-1 ring-blue-500 shadow-sm' 
                                                        : 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs sm:text-sm font-medium">
                                                        {new Date(timeString).toLocaleTimeString('vi-VN', { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                    {isCurrent && (
                                                        <span className="text-[8px] sm:text-xs font-medium text-blue-600 bg-blue-100 px-1 sm:px-2 py-0 sm:py-0.5 rounded-full">
                                                            Nay
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="my-1 sm:my-2 text-xl sm:text-2xl text-center">
                                                    {weatherCodes[weatherData.hourly.weatherCode[index]]?.icon}
                                                </div>
                                                <p className="text-xs sm:text-sm font-semibold text-center">
                                                    {weatherData.hourly.temperature[index].toFixed(1)}°C
                                                </p>
                                                <div className="mt-1 space-y-0.5">
                                                    <p className="text-[8px] sm:text-xs text-gray-500">
                                                        💧 {weatherData.hourly.precipitation[index].toFixed(1)}mm
                                                    </p>
                                                    <p className="text-[8px] sm:text-xs text-gray-500">
                                                        💨 {weatherData.hourly.windSpeed[index].toFixed(1)} km/h
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* Scroll Indicator for Mobile */}
                            <div className="mt-2 sm:hidden flex justify-center">
                                <div className="flex space-x-1">
                                    <div className="w-8 h-1 bg-blue-400 rounded-full"></div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 7-Day Forecast */}
                    <div className="bg-white rounded-lg shadow p-3 sm:p-6 w-full box-border">
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Dự báo 7 ngày tới</h3>
                        
                        {/* Mobile Layout */}
                        <div className="sm:hidden w-full">
                            {weatherData.daily.time.map((time, index) => (
                                <div 
                                    key={time} 
                                    className={`p-2 bg-gray-50 rounded-lg cursor-pointer transition-colors duration-200 mb-2 ${
                                        isSelectedDay(time) ? 'ring-1 ring-blue-500' : 'hover:bg-gray-100 active:bg-gray-200'
                                    } touch-manipulation w-full`}
                                    onClick={() => setSelectedDate(time)}
                                >
                                    <div className="flex items-center w-full">
                                        <div className="text-xl mr-3">{weatherCodes[weatherData.daily.weatherCode[index]]?.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{formatDate(time).split(', ')[0]}</p>
                                            <p className="text-[10px] text-gray-500 truncate">
                                                {weatherCodes[weatherData.daily.weatherCode[index]]?.description}
                                            </p>
                                        </div>
                                        <div className="text-right ml-2">
                                            <p className="text-xs font-semibold whitespace-nowrap">
                                                {weatherData.daily.temperatureMax[index].toFixed(0)}°/{weatherData.daily.temperatureMin[index].toFixed(0)}°
                                            </p>
                                            <p className="text-[10px] text-gray-500 whitespace-nowrap">
                                                Mưa: {weatherData.daily.precipitationProbabilityMax[index]}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Desktop Layout */}
                        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
                            {weatherData.daily.time.map((time, index) => (
                                <div 
                                    key={time} 
                                    className={`p-3 sm:p-4 bg-gray-50 rounded-lg cursor-pointer transition-colors duration-200 ${
                                        isSelectedDay(time) ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100 active:bg-gray-200'
                                    } touch-manipulation`}
                                    onClick={() => setSelectedDate(time)}
                                >
                                    <p className="text-xs sm:text-sm font-medium truncate">{formatDate(time)}</p>
                                    <div className="my-1 sm:my-2 text-xl sm:text-2xl">
                                        {weatherCodes[weatherData.daily.weatherCode[index]]?.icon}
                                    </div>
                                    <p className="text-xs sm:text-sm">
                                        {weatherData.daily.temperatureMax[index].toFixed(1)}°C /{' '}
                                        {weatherData.daily.temperatureMin[index].toFixed(1)}°C
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                        {weatherCodes[weatherData.daily.weatherCode[index]]?.description}
                                    </p>
                                    <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                                        <p className="text-[10px] sm:text-xs text-gray-500">
                                            UV: {weatherData.daily.uvIndexMax[index].toFixed(1)}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">
                                            Mưa: {weatherData.daily.rainSum[index].toFixed(1)}mm
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">
                                            Tuyết: {weatherData.daily.snowfallSum[index].toFixed(1)}cm
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">
                                            Số giờ mưa: {weatherData.daily.precipitationHours[index]}h
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">
                                            Gió mạnh nhất: {weatherData.daily.windGusts[index].toFixed(1)} km/h
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Add a safe area for mobile devices */}
            <div className="h-8 sm:h-0"></div>
        </div>
    )
}

// Thêm style cho scrollbar và mobile optimizations
const styles = `
@media (max-width: 640px) {
    .hide-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }
    
    body {
        -webkit-tap-highlight-color: transparent;
        overscroll-behavior-y: contain;
        background-color: #f9fafb;
    }
    
    input, button, a {
        -webkit-tap-highlight-color: transparent;
    }
    
    /* Fix cho mobile width */
    * {
        box-sizing: border-box;
    }
    
    body, html {
        width: 100%;
        max-width: 100vw;
        overflow-x: hidden;
    }
    
    div {
        max-width: 100%;
        width: auto;
    }
}

@media (min-width: 641px) {
    .hide-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #CBD5E1 transparent;
    }
    .hide-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    .hide-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .hide-scrollbar::-webkit-scrollbar-thumb {
        background-color: #CBD5E1;
        border-radius: 3px;
    }
    .hide-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #94A3B8;
    }
}

/* Pull to refresh styling */
.pull-to-refresh-indicator {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--pull-distance, 0px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: var(--pull-indicator-opacity, 0);
    transition: opacity 0.2s;
    pointer-events: none;
    z-index: 50;
}

.pull-to-refresh-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(0,0,0,0.1);
    border-top-color: #000;
    border-radius: 50%;
    margin-right: 8px;
    animation: spinner 0.6s linear infinite;
}

.pull-to-refresh-indicator span {
    font-size: 14px;
    color: #333;
}

@keyframes spinner {
    to {transform: rotate(360deg);}
}

/* Fix for iOS Safari bottom bar */
@supports (-webkit-touch-callout: none) {
    body {
        padding-bottom: env(safe-area-inset-bottom, 20px);
    }
}
`;

// Thêm style vào head
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
} 