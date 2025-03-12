'use client'

import { useState } from 'react'
import { LanguageIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'
import { SUPPORTED_LANGUAGES } from '@/constants/languages'

interface Message {
    id: number
    text: string
    translation: string
    isMe: boolean
    isTranslating: boolean
}

export default function ConversationTranslator() {
    const [myLanguage, setMyLanguage] = useState('vi')
    const [theirLanguage, setTheirLanguage] = useState('en')
    const [myText, setMyText] = useState('')
    const [theirText, setTheirText] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isTranslatingMine, setIsTranslatingMine] = useState(false)
    const [isTranslatingTheirs, setIsTranslatingTheirs] = useState(false)

    const translateAndSend = async (text: string, isMe: boolean) => {
        if (!text.trim()) return

        const sourceLanguage = isMe ? myLanguage : theirLanguage
        const targetLanguage = isMe ? theirLanguage : myLanguage

        const newMessage: Message = {
            id: Date.now(),
            text,
            translation: '',
            isMe,
            isTranslating: true
        }

        setMessages(prev => [...prev, newMessage])

        try {
            const prompt = `Translate this text from ${SUPPORTED_LANGUAGES.find(l => l.code === sourceLanguage)?.name} to ${SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name}. Only return the translation, no explanations:

${text}`
            const result = await aiService.processWithAI(prompt)

            setMessages(prev => prev.map(msg =>
                msg.id === newMessage.id
                    ? { ...msg, translation: result, isTranslating: false }
                    : msg
            ))
        } catch (error) {
            console.error('Translation error:', error)
            setMessages(prev => prev.map(msg =>
                msg.id === newMessage.id
                    ? { ...msg, translation: 'Lỗi dịch', isTranslating: false }
                    : msg
            ))
        }
    }

    const handleSendMyMessage = async () => {
        if (!myText.trim()) return
        setIsTranslatingMine(true)
        await translateAndSend(myText, true)
        setMyText('')
        setIsTranslatingMine(false)
    }

    const handleSendTheirMessage = async () => {
        if (!theirText.trim()) return
        setIsTranslatingTheirs(true)
        await translateAndSend(theirText, false)
        setTheirText('')
        setIsTranslatingTheirs(false)
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Language Selection */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                <LanguageIcon className="h-5 w-5 text-gray-400" />
                                Ngôn ngữ của bạn
                            </label>
                            <select
                                value={myLanguage}
                                onChange={(e) => setMyLanguage(e.target.value)}
                                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/50"
                            >
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                <LanguageIcon className="h-5 w-5 text-gray-400" />
                                Ngôn ngữ của người khác
                            </label>
                            <select
                                value={theirLanguage}
                                onChange={(e) => setTheirLanguage(e.target.value)}
                                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/50"
                            >
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="h-[400px] sm:h-[600px] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/50">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex flex-col ${message.isMe ? 'items-start' : 'items-end'}`}
                        >
                            {/* Main Message Bubble */}
                            <div
                                className={`max-w-[90%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-2xl mb-1
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
                                        <span>Đang dịch...</span>
                                    </div>
                                ) : (
                                    <p className="text-sm sm:text-base">{message.isMe ? message.translation : message.text}</p>
                                )}
                            </div>

                            {/* Secondary Text Below */}
                            <div className={`max-w-[90%] sm:max-w-[80%] text-xs sm:text-sm ${message.isMe ? 'text-left' : 'text-right'}`}>
                                <div className="text-gray-600 italic">
                                    {message.isMe ? `Gốc: "${message.text}"` : `Dịch: "${message.translation}"`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 border-t border-gray-100 space-y-3">
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* My Message Input */}
                        <div className="space-y-2">
                            <div className="relative">
                                <textarea
                                    value={myText}
                                    onChange={(e) => setMyText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMyMessage()
                                        }
                                    }}
                                    placeholder={`Nhập tin nhắn bằng ${SUPPORTED_LANGUAGES.find(l => l.code === myLanguage)?.name}...`}
                                    className="w-full h-16 sm:h-20 p-2.5 sm:p-3 pr-20 sm:pr-24 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-gray-50/50"
                                />
                                <button
                                    onClick={handleSendMyMessage}
                                    disabled={isTranslatingMine || !myText.trim()}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-white text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isTranslatingMine || !myText.trim()
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-primary hover:bg-primary/90'
                                        }`}
                                >
                                    {isTranslatingMine ? (
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

                        {/* Their Message Input */}
                        <div className="space-y-2">
                            <div className="relative">
                                <textarea
                                    value={theirText}
                                    onChange={(e) => setTheirText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendTheirMessage()
                                        }
                                    }}
                                    placeholder={`Nhập tin nhắn bằng ${SUPPORTED_LANGUAGES.find(l => l.code === theirLanguage)?.name}...`}
                                    className="w-full h-16 sm:h-20 p-2.5 sm:p-3 pr-20 sm:pr-24 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-gray-50/50"
                                />
                                <button
                                    onClick={handleSendTheirMessage}
                                    disabled={isTranslatingTheirs || !theirText.trim()}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-white text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isTranslatingTheirs || !theirText.trim()
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-primary hover:bg-primary/90'
                                        }`}
                                >
                                    {isTranslatingTheirs ? (
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
                </div>
            </div>
        </div>
    )
} 