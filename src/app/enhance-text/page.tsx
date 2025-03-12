'use client'

import { useState } from 'react'
import { MdAutoFixHigh, MdCompareArrows, MdContentCopy } from 'react-icons/md'
import { aiService } from '@/lib/ai-service'
import { useToast, ToastContainer } from '@/utils/toast'

export default function EnhanceTextPage() {
    const [text, setText] = useState('')
    const [enhancedText, setEnhancedText] = useState('')
    const [isEnhancing, setIsEnhancing] = useState(false)
    const { loading, success, error, removeToast } = useToast();

    const handleEnhance = async () => {
        if (!text.trim()) return

        setIsEnhancing(true)
        const loadingId = loading('Đang cải thiện văn bản...');
        try {
            const result = await aiService.enhanceText(text)
            setEnhancedText(result)
            removeToast(loadingId);
            success('Cải thiện văn bản thành công!');
        } catch (err) {
            console.error('Text enhancement error:', err)
            removeToast(loadingId);
            error('Có lỗi xảy ra khi cải thiện văn bản. Vui lòng thử lại.')
        } finally {
            setIsEnhancing(false)
        }
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(enhancedText)
            success('Đã sao chép vào clipboard!');
        } catch (err) {
            console.error('Copy error:', err)
            error('Không thể sao chép văn bản');
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-4">
                    <div className="bg-white p-8 rounded-2xl border-gray-100 transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <MdAutoFixHigh className="h-6 w-6 text-primary" />
                                Văn bản gốc
                            </h2>
                        </div>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full h-[400px] p-6 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none text-gray-800 placeholder-gray-400 bg-gray-50/50 text-base leading-relaxed"
                            placeholder="Nhập văn bản cần cải thiện..."
                        />

                        <div className="mt-6">
                            <button
                                onClick={handleEnhance}
                                disabled={isEnhancing || !text.trim()}
                                className={`w-full py-4 px-6 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-3 text-lg ${isEnhancing || !text.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/25'
                                    }`}
                            >
                                {isEnhancing ? (
                                    <>
                                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
                                        Đang cải thiện...
                                    </>
                                ) : (
                                    <>
                                        <MdAutoFixHigh className="h-6 w-6" />
                                        Cải thiện văn bản
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Output Section */}
                <div className="space-y-4">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <MdCompareArrows className="h-6 w-6 text-primary" />
                                Kết quả cải thiện
                            </h2>
                            {enhancedText && (
                                <button
                                    onClick={handleCopy}
                                    className="p-3 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <MdContentCopy className="h-5 w-5" />
                                    <span>Sao chép</span>
                                </button>
                            )}
                        </div>

                        {enhancedText ? (
                            <div className="prose prose-lg max-w-none">
                                <div className="whitespace-pre-wrap text-gray-800 min-h-[400px] p-6 bg-gray-50 rounded-xl border border-gray-100 shadow-inner text-base leading-relaxed">
                                    {enhancedText}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 gap-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <MdAutoFixHigh className="h-16 w-16 text-gray-300" />
                                <span className="text-lg">Văn bản đã cải thiện sẽ xuất hiện ở đây...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    )
} 