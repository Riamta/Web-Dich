'use client'

import { useState, useRef, useEffect } from 'react'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'
import { useToast, ToastContainer } from '@/utils/toast'

interface Message {
    id: number;
    text: string;
    isMe: boolean;
    isTranslating: boolean;
}

type Gender = 'male' | 'female';

export default function FlirtingChat() {
    const [text, setText] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isTranslating, setIsTranslating] = useState(false)
    const [copySuccess, setCopySuccess] = useState<{id: number, type: 'original' | 'translated' | 'main'} | null>(null)
    const [gender, setGender] = useState<Gender>('male')
    
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
            const prompt = `You are a ${gender === 'male' ? 'male' : 'female'} flirting expert. Respond to this message with a flirty, engaging, and appropriate response in Vietnamese language. Keep it natural, playful, and respectful. The response should be from a ${gender === 'male' ? 'man' : 'woman'}'s perspective.

Message: "${userMessage}"

Respond with ONLY the message, no explanations or additional text.`

            const aiResponse = await aiService.processWithAI(prompt)

            // Add AI response to messages
            const newMessage: Message = {
                id: Date.now(),
                text: aiResponse,
                isMe: false,
                isTranslating: false
            }

            setMessages(prev => [...prev, newMessage])
        } catch (error) {
            console.error('AI response error:', error)
            toastError('Có lỗi xảy ra khi tạo phản hồi. Vui lòng thử lại.')
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

    return (
        <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Gender Selection */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex items-center justify-center gap-4">
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
                    </div>
                </div>

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