'use client'

import Link from 'next/link'
import {
    DocumentTextIcon,
    LanguageIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    BoltIcon,
    CodeBracketIcon,
    UserIcon,
    HeartIcon,
    FilmIcon,
    DocumentIcon,
    ChatBubbleLeftIcon,
    LightBulbIcon,
    SparklesIcon,
    WrenchIcon,
    AcademicCapIcon,
    CurrencyDollarIcon,
    QrCodeIcon,
    EnvelopeIcon,
    CreditCardIcon,
    CalculatorIcon,
    ClockIcon,
    RectangleStackIcon,
    StarIcon,
    BeakerIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    CloudIcon,
    FlagIcon,
    ArrowPathIcon,
    ArrowsRightLeftIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
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
        <Link href={path} className="block group">
            <div className="p-6 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-300 h-full flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
                        <div className="w-5 h-5 text-gray-700 group-hover:text-black transition-colors">
                            {icon}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-base text-gray-900 group-hover:text-black transition-colors">{title}</h3>
                            {isHot && (
                                <span className="px-2 py-0.5 text-xs rounded-full text-white bg-gradient-to-r from-orange-500 to-red-500">
                                    Hot
                                </span>
                            )}
                            {(badge === 'Popular' || isPopular) && !isHot && (
                                <span className="px-2 py-0.5 text-xs rounded-full text-white bg-gray-900">
                                    Popular
                                </span>
                            )}
                            {badge === 'New' && (
                                <span className="px-2 py-0.5 text-xs rounded-full text-white bg-gradient-to-r from-blue-500 to-indigo-500">
                                    New
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{description}</p>
                    </div>
                </div>

                <div className="mt-auto flex justify-end text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                        <EyeIcon className="h-3 w-3" />
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
        icon: <SparklesIcon className="w-6 h-6 text-black" />,
        features: [
            {
                title: "Dịch thuật AI",
                description: "Dịch văn bản giữa các ngôn ngữ bằng AI",
                icon: <LanguageIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/translate"
            },
            {
                title: "Dịch hội thoại",
                description: "Dịch các cuộc hội thoại và đoạn chat",
                icon: <ChatBubbleLeftIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/conversation-translate"
            },
            {
                title: "Dịch phụ đề",
                description: "Dịch file phụ đề SRT sang nhiều ngôn ngữ",
                icon: <FilmIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/srt-translate"
            },
            {
                title: "Từ điển",
                description: "Tra cứu từ điển đa ngôn ngữ",
                icon: <BookOpenIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/dictionary"
            },
            {
                title: "Học từ vựng",
                description: "Học và luyện tập từ vựng hiệu quả",
                icon: <BoltIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/vocabulary"
            },
            {
                title: "Tạo câu hỏi",
                description: "Tạo các bài tập và câu hỏi trắc nghiệm",
                icon: <DocumentTextIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/quiz"
            },
            {
                title: "Cải thiện văn bản",
                description: "Nâng cao chất lượng văn bản của bạn",
                icon: <CodeBracketIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/enhance-text"
            },
            {
                title: "Tóm tắt văn bản",
                description: "Tự động tóm tắt văn bản dài",
                icon: <DocumentIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/summarize"
            },
            {
                title: "Giải bài tập",
                description: "Giải bài tập bằng AI",
                icon: <BoltIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/aisolver"
            },
            {
                title: "Hỗ trợ tán gái",
                description: "Hỗ trợ tán gái bằng AI",
                icon: <HeartIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/flirting"
            },
            {
                title: "Xem bói",
                description: "Xem bói bằng AI",
                icon: <StarIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/fortune-telling"
            }
        ]
    },
    {
        title: "Tiện ích",
        description: "Các công cụ hỗ trợ tiện ích",
        icon: <WrenchIcon className="w-6 h-6 text-black" />,
        features: [
            {
                title: "Công cụ ngẫu nhiên",
                description: "Tạo số ngẫu nhiên, chuỗi",
                icon: <ArrowsRightLeftIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/random-tools",
                badge: "New"
            },
            {
                title: "Thông tin quốc gia",
                description: "Thông tin chi tiết về quốc gia",
                icon: <FlagIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/countries"
            },
            {
                title: "Dự báo thời tiết",
                description: "Xem dự báo thời tiết chi tiết với bản đồ tương tác",
                icon: <CloudIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/weather",
                badge: "New"
            },
            {
                title: "Tạo tên người dùng",
                description: "Tạo tên người dùng sáng tạo",
                icon: <UserIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/username-generator"
            },
            {
                title: "Mã QR",
                description: "Tạo và quét mã QR",
                icon: <QrCodeIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/qrcode"
            },
            {
                title: "Email tạm thời",
                description: "Tạo email tạm",
                icon: <EnvelopeIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/temp-mail"
            },
            {
                title: "Chuyển đổi múi giờ",
                description: "Chuyển đổi múi giờ giữa các thành phố trên thế giới",
                icon: <ClockIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/time-converter"
            },
            {
                title: "Chuyển đổi đơn vị",
                description: "Chuyển đổi đơn vị giữa các đơn vị khác nhau",
                icon: <RectangleStackIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/unit-converter"
            },
            {
                title: "Tính tuổi",
                description: "Tính tuổi của bạn",
                icon: <CalculatorIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/age-calculator"
            },
            {
                title: "Công cụ ngẫu nhiên",
                description: "Tạo số ngẫu nhiên, chuỗi, ID, màu sắc và nhiều hơn nữa",
                icon: <ArrowsRightLeftIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/random",
                badge: "New"
            }
        ]
    },
    {
        title: "Tài chính",
        description: "Các công cụ tài chính",
        icon: <CurrencyDollarIcon className="w-6 h-6 text-black" />,
        features: [
            {
                title: "Chuyển đổi tiền tệ",
                description: "Chuyển đổi giữa các loại tiền tệ khác nhau",
                icon: <CurrencyDollarIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/currency",
                badge: "New"
            },
            {
                title: "Tính lãi suất",
                description: "Tính lãi suất tiết kiệm",
                icon: <CalculatorIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/interest-calculator"
            },
            {
                title: "Tính khoản vay",
                description: "Tính khoản vay và lãi suất",
                icon: <CalculatorIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/loan-calculator"
            },
            {
                title: "Quản lý chi tiêu",
                description: "Quản lý chi tiêu của bạn",
                icon: <CreditCardIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/money-love"
            },

        ]
    },
    {
        title: "Sức khỏe",
        description: "Các công cụ sức khỏe",
        icon: <HeartIcon className="w-6 h-6 text-black" />,
        features: [
            {
                title: "Tính chỉ số BMI",
                description: "Tính chỉ số BMI của bạn",
                icon: <CalculatorIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/utilities/bmi-calculator"
            },
            {
                title: "Lên lịch luyện tập",
                description: "Tạo lịch tập phù hợp với cơ thể bạn",
                icon: <ClipboardDocumentCheckIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/workout-scheduler",
                badge: "New"
            },
            {
                title: "Công thức nấu ăn",
                description: "Tạo công thức nấu ăn bằng AI",
                icon: <BeakerIcon className="w-6 h-6 text-black" />,
                views: 0,
                path: "/recipe-generator"
            }
        ]
    }
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

    // Fetch page views
    const fetchPageViews = async () => {
        try {
            const response = await fetch('/api/page-views');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.reduce((acc: Record<string, number>, view: { path: string; views: number }) => {
                acc[view.path] = view.views;
                return acc;
            }, {} as Record<string, number>);
        } catch (error) {
            console.error('Error fetching page views:', error);
            return {};
        }
    };

    // Updated to use SWR in the future:
    // import useSWR from 'swr'
    // const { data: viewsData, error } = useSWR('/api/page-views', fetchPageViews, {
    //   refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    //   revalidateOnFocus: false,
    //   dedupingInterval: 60 * 1000, // Dedupe requests within 1 minute
    // });

    useEffect(() => {
        // Helper function to update top pages
        const updateTopPages = (viewsMap: Record<string, number>) => {
            // Get all paths and sort by views
            const sortedPaths = Object.entries(viewsMap)
                .sort((a, b) => b[1] - a[1]) // Sort by views in descending order
                .slice(0, 3) // Take top 3
                .map(([path]) => path); // Extract just the paths

            setTopPages(sortedPaths);
        };

        const fetchData = async () => {
            const data = await fetchPageViews();
            setPageViews(data);
            updateTopPages(data);
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Search and Filter Section */}
            <div className="mb-10 space-y-5 max-w-3xl mx-auto">
                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm công cụ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-full border border-gray-200 pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 shadow-sm"
                        autoComplete="off"
                        spellCheck="false"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-normal transition-all duration-300 ${selectedCategory === null
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Tất cả
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.title}
                            onClick={() => setSelectedCategory(category.title)}
                            className={`px-4 py-2 rounded-full text-sm font-normal transition-all duration-300 ${selectedCategory === category.title
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
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
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-2">
                            <div className="p-2 rounded-lg bg-gray-50">
                                {category.icon}
                            </div>
                            <div>
                                <h2 className="text-xl font-medium text-gray-900">{category.title}</h2>
                                <p className="text-sm text-gray-500">{category.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg font-light">
                            Không tìm thấy kết quả phù hợp với tìm kiếm của bạn.
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-3 text-sm text-gray-900 underline underline-offset-2"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
} 