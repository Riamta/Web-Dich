'use client'

import { useState, useRef, useEffect } from 'react'
import { ClipboardDocumentIcon, SparklesIcon, HandRaisedIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'
import { useToast, ToastContainer } from '@/utils/toast'

interface Message {
    id: number;
    text: string;
    isMe: boolean;
    isTranslating: boolean;
}

type Gender = 'male' | 'female' | 'gay' | 'lesbian';

export default function FlirtingChat() {
    const [text, setText] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isTranslating, setIsTranslating] = useState(false)
    const [copySuccess, setCopySuccess] = useState<{id: number, type: 'original' | 'translated' | 'main'} | null>(null)
    const [gender, setGender] = useState<Gender>('male')
    const [responseCount, setResponseCount] = useState(1)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    
    // Add ref for chat container
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const { success, error: toastError } = useToast()

    // Auto scroll to bottom when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            const scrollContainer = chatContainerRef.current
            // Smooth scroll to bottom
            scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [messages])

    const handleCopy = async (text: string, messageId: number, type: 'original' | 'translated' | 'main') => {
        try {
            await navigator.clipboard.writeText(text)
            setCopySuccess({ id: messageId, type })
            setTimeout(() => setCopySuccess(null), 2000)
            success('Đã sao chép vào clipboard!')
        } catch (err) {
            console.error('Failed to copy text:', err)
            toastError('Không thể sao chép văn bản')
        }
    }

    const generateAIResponse = async (userMessage: string) => {
        setIsTranslating(true)

        try {
            // Generate AI response
            const prompt = `You are a ${gender === 'male' ? 'male' : gender === 'female' ? 'female' : gender === 'gay' ? 'gay male' : 'lesbian female'} flirting expert. Generate ${responseCount} different responses in Vietnamese language. Use casual, friendly, and simple language that people use in everyday conversations. Avoid using fancy or formal words. Keep it natural and relatable.

Message: "${userMessage}"

Respond with ONLY the ${responseCount} messages, each on a new line, no explanations or additional text.`

            const aiResponse = await aiService.processWithAI(prompt)
            const responses = aiResponse.split('\n').filter(line => line.trim())

            // Add AI responses to messages
            responses.forEach(response => {
                const newMessage: Message = {
                    id: Date.now() + Math.random(),
                    text: response.trim(),
                    isMe: false,
                    isTranslating: false
                }
                setMessages(prev => [...prev, newMessage])
            })
        } catch (error) {
            console.error('AI response error:', error)
            toastError('Có lỗi xảy ra khi tạo phản hồi. Vui lòng thử lại.')
        } finally {
            setIsTranslating(false)
        }
    }

    const generateSuggestions = async (type: 'opening' | 'goodbye' | 'goodnight' | 'meet' | 'food' | 'breakup' | 'flirt' | 'apology') => {
        setIsTranslating(true)
        setShowSuggestions(true)

        try {
            const prompt = `You are a ${gender === 'male' ? 'male' : gender === 'female' ? 'female' : gender === 'gay' ? 'gay male' : 'lesbian female'} flirting expert. Generate 5 ${type === 'opening' ? 'opening lines' : type === 'goodbye' ? 'goodbye messages' : type === 'goodnight' ? 'goodnight messages' : type === 'meet' ? 'messages to ask for a date' : type === 'food' ? 'messages to ask about food' : type === 'breakup' ? 'messages to break up' : type === 'flirt' ? 'flirty messages' : 'apology messages'} in Vietnamese language. Use casual, friendly, and simple language that people use in everyday conversations. Avoid using fancy or formal words. Keep it natural and relatable.

Respond with ONLY the 5 messages, each on a new line, no explanations or additional text.`

            const aiResponse = await aiService.processWithAI(prompt)
            const responses = aiResponse.split('\n').filter(line => line.trim())
            setSuggestions(responses)
        } catch (error) {
            console.error('AI response error:', error)
            toastError('Có lỗi xảy ra khi tạo gợi ý. Vui lòng thử lại.')
        } finally {
            setIsTranslating(false)
        }
    }

    const handleSendMessage = async () => {
        if (!text.trim()) return

        // Add user message
        const userMessage: Message = {
            id: Date.now(),
            text: text.trim(),
            isMe: true,
            isTranslating: false
        }

        setMessages(prev => [...prev, userMessage])
        setText('')

        // Generate AI response
        await generateAIResponse(text.trim())
    }

    const handleSuggestionClick = (suggestion: string) => {
        setText(suggestion)
        setShowSuggestions(false)
        setSuggestions([])
    }

    return (
        <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Gender Selection */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-center gap-4">
                            <label className="text-sm font-medium text-gray-700">Giới tính của đối phương là:</label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setGender('male')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        gender === 'male'
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Nam
                                </button>
                                <button
                                    onClick={() => setGender('female')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        gender === 'female'
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Nữ
                                </button>
                                <button
                                    onClick={() => setGender('gay')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        gender === 'gay'
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Gay
                                </button>
                                <button
                                    onClick={() => setGender('lesbian')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        gender === 'lesbian'
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Lesbian
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                            <label className="text-sm font-medium text-gray-700">Số câu trả lời:</label>
                            <select
                                value={responseCount}
                                onChange={(e) => setResponseCount(Number(e.target.value))}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Suggestion Buttons */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            onClick={() => generateSuggestions('opening')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <SparklesIcon className="h-5 w-5" />
                            Câu mở đầu
                        </button>
                        <button
                            onClick={() => generateSuggestions('goodbye')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <HandRaisedIcon className="h-5 w-5" />
                            Câu tạm biệt
                        </button>
                        <button
                            onClick={() => generateSuggestions('goodnight')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                            Chúc ngủ ngon
                        </button>
                        <button
                            onClick={() => generateSuggestions('meet')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Muốn làm quen
                        </button>
                        <button
                            onClick={() => generateSuggestions('food')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                <line x1="6" y1="1" x2="6" y2="4" />
                                <line x1="10" y1="1" x2="10" y2="4" />
                                <line x1="14" y1="1" x2="14" y2="4" />
                            </svg>
                            Hỏi ăn cơm
                        </button>
                        <button
                            onClick={() => generateSuggestions('breakup')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                            Chia tay
                        </button>
                        <button
                            onClick={() => generateSuggestions('flirt')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-pink-50 text-pink-600 hover:bg-pink-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L12 5.34l-.77-.76a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
                            </svg>
                            Tán tỉnh
                        </button>
                        <button
                            onClick={() => generateSuggestions('apology')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                            Xin lỗi
                        </button>
                    </div>
                </div>

                {/* Suggestions Panel */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="space-y-2">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="w-full text-left p-2 rounded-lg hover:bg-white transition-all duration-200"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Messages */}
                <div 
                    ref={chatContainerRef}
                    className="h-[400px] sm:h-[600px] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/50"
                >
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex flex-col ${message.isMe ? 'items-start' : 'items-end'}`}
                        >
                            {/* Main Message Bubble */}
                            <div
                                className={`max-w-[90%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-2xl mb-1 group relative
                                    ${message.isMe
                                        ? 'bg-primary text-white rounded-tl-none'
                                        : 'bg-white border border-gray-200 rounded-tr-none'
                                    }`}
                            >
                                {message.isTranslating ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                                        <span>...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm sm:text-base flex-1">
                                            {message.text}
                                        </p>
                                        <button
                                            onClick={() => handleCopy(message.text, message.id, 'main')}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                                                message.isMe 
                                                    ? 'hover:bg-white/20 text-white/80 hover:text-white' 
                                                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                                            }`}
                                            title="Copy message"
                                        >
                                            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 border-t border-gray-100">
                    <div className="relative">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                            placeholder="Nhập tin nhắn của đối phương..."
                            className="w-full h-16 sm:h-20 p-2.5 sm:p-3 pr-20 sm:pr-24 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-gray-50/50"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isTranslating || !text.trim()}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-white text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                isTranslating || !text.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary/90'
                            }`}
                        >
                            {isTranslating ? (
                                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
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
                            ) : (
                                'Gửi'
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    )
} 