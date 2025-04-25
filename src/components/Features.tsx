'use client'

import Link from 'next/link'
import {
    FileText,
    Languages,
    Book,
    MessageSquare,
    Brain,
    FileCode,
    User,
    Heart,
    Subtitles,
    ScrollText,
    MessageCircle,
    Lightbulb,
    Sparkles,
    Wrench,
    GraduationCap,
    DollarSign,
    QrCode,
    Mail,
    CreditCard,
    Calculator,
    Clock,
    Ruler,
    Star,
    Utensils,
    Eye,
    Search
} from 'lucide-react'
import { useEffect, useState } from 'react';
import { PageView } from '@/models/PageView';

interface FeatureCardProps {
    title: string
    description: string
    icon: React.ReactNode
    views: number
    path: string
    badge?: 'Popular' | 'New'
    isHot?: boolean
}

interface CategoryProps {
    title: string
    description: string
    icon: React.ReactNode
    features: FeatureCardProps[]
}

const FeatureCard = ({ title, description, icon, views, path, badge, isHot }: FeatureCardProps) => {
    // Determine if this feature is popular based on view count
    const isPopular = views > 100; // Consider features with more than 100 views as popular
    
    return (
        <Link href={path} className="block">
            <div className="p-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-gray-100">
                        {icon}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{title}</h3>
                            {isHot && (
                                <span className="px-2 py-1 text-xs rounded-full text-white bg-red-500">
                                    Hot
                                </span>
                            )}
                            {(badge === 'Popular' || isPopular) && !isHot && (
                                <span className="px-2 py-1 text-xs rounded-full text-white bg-black">
                                    Popular
                                </span>
                            )}
                            {badge === 'New' && (
                                <span className="px-2 py-1 text-xs rounded-full text-white bg-blue-500">
                                    New
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600">{description}</p>
                    </div>
                </div>

                <div className="flex justify-end text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{views}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

const categories: CategoryProps[] = [
    {
        title: "Công cụ AI",
        description: "Các công cụ sử dụng trí tuệ nhân tạo",
        icon: <Sparkles className="w-6 h-6 text-black" />,
        features: [
            {
                title: "Dịch thuật AI",
                description: "Dịch văn bản giữa các ngôn ngữ bằng AI",
                icon: <Languages className="w-6 h-6 text-black" />,
                views: 0,
                path: "/translate"
            },
            {
                title: "Dịch hội thoại",
                description: "Dịch các cuộc hội thoại và đoạn chat",
                icon: <MessageCircle className="w-6 h-6 text-black" />,
                views: 0,
                path: "/conversation-translate"
            },
            {
                title: "Dịch phụ đề",
                description: "Dịch file phụ đề SRT sang nhiều ngôn ngữ",
                icon: <Subtitles className="w-6 h-6 text-black" />,
                views: 0,
                path: "/srt-translate"
            },
            {
                title: "Từ điển",
                description: "Tra cứu từ điển đa ngôn ngữ",
                icon: <Book className="w-6 h-6 text-black" />,
                views: 0,
                path: "/dictionary"
            },
            {
                title: "Học từ vựng",
                description: "Học và luyện tập từ vựng hiệu quả",
                icon: <Brain className="w-6 h-6 text-black" />,
                views: 0,
                path: "/vocabulary"
            },
            {
                title: "Tạo câu hỏi",
                description: "Tạo các bài tập và câu hỏi trắc nghiệm",
                icon: <FileText className="w-6 h-6 text-black" />,
                views: 0,
                path: "/quiz"
            },
            {
                title: "Cải thiện văn bản",
                description: "Nâng cao chất lượng văn bản của bạn",
                icon: <FileCode className="w-6 h-6 text-black" />,
                views: 0,
                path: "/enhance-text"
            },
            {
                title: "Tóm tắt văn bản",
                description: "Tự động tóm tắt văn bản dài",
                icon: <ScrollText className="w-6 h-6 text-black" />,
                views: 0,
                path: "/summarize"
            },
            {
                title: "Giải bài tập",
                description: "Giải bài tập bằng AI",
                icon: <Brain className="w-6 h-6 text-black" />,
                views: 0,
                path: "/aisolver"
            },
            {
                title: "Hỗ trợ tán gái",
                description: "Hỗ trợ tán gái bằng AI",
                icon: <Heart className="w-6 h-6 text-black" />,
                views: 0,
                path: "/flirting"
            },
            {
                title: "Xem bói",
                description: "Xem bói bằng AI",
                icon: <Star className="w-6 h-6 text-black" />,
                views: 0,
                path: "/fortune-telling"
            },
            {
                title: "Tạo công thức nấu ăn",
                description: "Tạo công thức nấu ăn bằng AI",
                icon: <Utensils className="w-6 h-6 text-black" />,
                views: 0,
                path: "/recipe-generator"
            }
        ]
    },
    {
        title: "Tiện ích",
        description: "Các công cụ hỗ trợ tiện ích",
        icon: <Wrench className="w-6 h-6 text-black" />,
        features: [
            {
                title: "Chuyển đổi tiền tệ",
                description: "Chuyển đổi giữa các loại tiền tệ khác nhau",
                icon: <DollarSign className="w-6 h-6 text-black" />,
                views: 0,
                path: "/currency",
                badge: "New"
            },
            {
                title: "Tính lãi suất",
                description: "Tính lãi suất tiết kiệm",
                icon: <Calculator className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/interest-calculator"
            },
            {
                title: "Tính khoản vay",
                description: "Tính khoản vay và lãi suất",
                icon: <Calculator className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/loan-calculator"
            },
            {
                title: "Quản lý chi tiêu",
                description: "Quản lý chi tiêu của bạn",
                icon: <CreditCard className="w-6 h-6 text-black" />,
                views: 0,
                path: "/money-love"
            },
            {
                title: "Tạo tên người dùng",
                description: "Tạo tên người dùng sáng tạo",
                icon: <User className="w-6 h-6 text-black" />,
                views: 0,
                path: "/username-generator"
            },
            {
                title: "Mã QR",
                description: "Tạo và quét mã QR",
                icon: <QrCode className="w-6 h-6 text-black" />,
                views: 0,
                path: "/qrcode"
            },
            {
                title: "Email tạm thời",
                description: "Tạo email tạm",
                icon: <Mail className="w-6 h-6 text-black" />,
                views: 0,
                path: "/temp-mail"
            },
            {
                title: "Chuyển đổi múi giờ",
                description: "Chuyển đổi múi giờ giữa các thành phố trên thế giới",
                icon: <Clock className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/time-converter"
            },
            {
                title: "Chuyển đổi đơn vị",
                description: "Chuyển đổi đơn vị giữa các đơn vị khác nhau",
                icon: <Ruler className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/unit-converter"
            },
            {
                title: "Tính chỉ số BMI",
                description: "Tính chỉ số BMI của bạn",
                icon: <Calculator className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/bmi-calculator"
            },
            {
                title: "Tính tuổi",
                description: "Tính tuổi của bạn",
                icon: <Calculator className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/age-calculator"
            }
        ]
    },
]

export default function Features() {
    const [pageViews, setPageViews] = useState<Record<string, number>>({});
    const [topPages, setTopPages] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Normalize text for search
    const normalizeText = (text: string) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[đĐ]/g, 'd')           // Handle Vietnamese đ/Đ
            .trim();
    };

    // Filter features based on search query and selected category
    const filteredCategories = categories
        .filter(category => !selectedCategory || category.title === selectedCategory)
        .map(category => ({
            ...category,
            features: category.features.filter(feature => {
                if (!debouncedSearchQuery) return true;
                
                const normalizedSearch = normalizeText(debouncedSearchQuery);
                const normalizedTitle = normalizeText(feature.title);
                const normalizedDescription = normalizeText(feature.description);
                
                return normalizedTitle.includes(normalizedSearch) ||
                       normalizedDescription.includes(normalizedSearch);
            })
        }))
        .filter(category => category.features.length > 0);

    useEffect(() => {
        const CACHE_KEY = 'page_views_cache';
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

        const fetchPageViews = async () => {
            try {
                // Check cache first
                const cachedData = localStorage.getItem(CACHE_KEY);
                if (cachedData) {
                    const { data, timestamp } = JSON.parse(cachedData);
                    const now = Date.now();
                    
                    // If cache is still valid (less than 5 minutes old)
                    if (now - timestamp < CACHE_DURATION) {
                        console.log('Using cached page views');
                        setPageViews(data);
                        updateTopPages(data);
                        return;
                    }
                }

                // If no cache or cache expired, fetch new data
                console.log('Fetching fresh page views');
                const response = await fetch('/api/page-views');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const viewsMap = data.reduce((acc: Record<string, number>, view: { path: string; views: number }) => {
                    acc[view.path] = view.views;
                    return acc;
                }, {} as Record<string, number>);

                // Update state and cache
                setPageViews(viewsMap);
                updateTopPages(viewsMap);
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: viewsMap,
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.error('Error fetching page views:', error);
                // If fetch fails and we have cached data, use it as fallback
                const cachedData = localStorage.getItem(CACHE_KEY);
                if (cachedData) {
                    const { data } = JSON.parse(cachedData);
                    setPageViews(data);
                    updateTopPages(data);
                } else {
                    setPageViews({});
                    setTopPages([]);
                }
            }
        };

        // Helper function to update top pages
        const updateTopPages = (viewsMap: Record<string, number>) => {
            // Get all paths and sort by views
            const sortedPaths = Object.entries(viewsMap)
                .sort((a, b) => b[1] - a[1]) // Sort by views in descending order
                .slice(0, 3) // Take top 3
                .map(([path]) => path); // Extract just the paths
            
            setTopPages(sortedPaths);
        };

        fetchPageViews();

        // Set up interval to refresh cache every 5 minutes
        const intervalId = setInterval(fetchPageViews, CACHE_DURATION);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Search and Filter Section */}
            <div className="mb-8 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm công cụ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-lg border border-gray-200 pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        autoComplete="off"
                        spellCheck="false"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedCategory === null
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Tất cả
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.title}
                            onClick={() => setSelectedCategory(category.title)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedCategory === category.title
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {category.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Features Grid */}
            <div className="space-y-16">
                {filteredCategories.map((category, index) => (
                    <div key={index} className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-gray-100">
                                {category.icon}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{category.title}</h3>
                                <p className="text-gray-600">{category.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {category.features.map((feature, featureIndex) => (
                                <FeatureCard
                                    key={featureIndex}
                                    {...feature}
                                    views={pageViews[feature.path] || 0}
                                    isHot={topPages.includes(feature.path)}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {/* No Results Message */}
                {filteredCategories.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            Không tìm thấy kết quả phù hợp với tìm kiếm của bạn.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
} 