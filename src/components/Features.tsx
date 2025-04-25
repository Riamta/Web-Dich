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
    Utensils
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
}

interface CategoryProps {
    title: string
    description: string
    icon: React.ReactNode
    features: FeatureCardProps[]
}

const FeatureCard = ({ title, description, icon, views, path, badge }: FeatureCardProps) => {
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
                            {badge && (
                                <span className={`px-2 py-1 text-xs rounded-full text-white ${badge === 'Popular' ? 'bg-black' : 'bg-blue-500'
                                    }`}>
                                    {badge}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600">{description}</p>
                    </div>
                </div>

                <div className="flex justify-end text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <span>👁</span>
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
                path: "/translate",
                badge: "Popular"
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
                path: "/summarize",
                badge: "Popular"
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

    useEffect(() => {
        const fetchPageViews = async () => {
            try {
                const response = await fetch('/api/page-views');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const viewsMap = data.reduce((acc: Record<string, number>, view: { path: string; views: number }) => {
                    acc[view.path] = view.views;
                    return acc;
                }, {} as Record<string, number>);
                setPageViews(viewsMap);
            } catch (error) {
                console.error('Error fetching page views:', error);
                // Set empty object as fallback
                setPageViews({});
            }
        };

        fetchPageViews();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-16">
                {categories.map((category, index) => (
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
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 