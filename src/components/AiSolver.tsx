'use client'

import { useState, useRef, useEffect } from 'react'
import { PhotoIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri
} from "@google/genai"
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import { Components } from 'react-markdown'
import { SUPPORTED_LANGUAGES } from '@/constants/languages'
import { GoogleGenerativeAI } from '@google/generative-ai';

// Custom renderer components for ReactMarkdown
const renderers: Partial<Components> = {
    code({ children, className }) {
        const value = String(children).replace(/\n$/, '')
        
        // Inline math
        if (value.startsWith('$') && value.endsWith('$')) {
            return <InlineMath math={value.slice(1, -1)} />
        }
        
        // Block math
        if (value.startsWith('$$') && value.endsWith('$$')) {
            return <BlockMath math={value.slice(2, -2)} />
        }
        
        // Regular code
        return (
            <pre className={className}>
                <code>{children}</code>
            </pre>
        )
    }
}

export function AiSolver() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [solution, setSolution] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPasteEnabled, setIsPasteEnabled] = useState(true)
    const [language, setLanguage] = useState('vi')
    const [needExplanation, setNeedExplanation] = useState(false)
    const [inputType, setInputType] = useState<'image' | 'text'>('image')
    const [exerciseText, setExerciseText] = useState('')
    const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash-preview-04-17' | 'gemini-2.0-flash'>('gemini-2.5-flash-preview-04-17')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageContainerRef = useRef<HTMLDivElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    const createSolverPrompt = (): string => {
        if (!needExplanation) {
            return `You are an expert AI tutor. Please provide a concise solution in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'Vietnamese'}.

MARKDOWN FORMATTING REQUIREMENTS:
- Use # for main section headers
- Use ## for subsection headers
- Use > for important notes or key points
- Use **bold** for emphasis on key terms
- Use \`code\` for mathematical terms or variables
- Use --- for section separators
- Use numbered lists (1., 2., etc.) for steps
- Use bullet points (•) for lists of items
- Use tables for organized data presentation
- Use proper indentation for nested lists

# Brief Explanation:
- Write 2-3 sentences explaining your approach
- Mention the key concept or formula used

# Answer:
- Provide the final answer clearly
- Use proper notation and units
- For mathematical expressions, use:
  * Inline math: $formula$ (e.g., $x^2 + y^2 = z^2$)
  * Block math: $$formula$$ (e.g., $$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$)

> Note: Keep it concise and clear. No need for detailed steps or multiple approaches.

Return ${language} only

IMPORTANT: Your ENTIRE response MUST be in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name} ONLY.`
        }

        return `You are an expert AI tutor. Please analyze the exercise/problem in the image and provide a detailed solution in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'Vietnamese'}.

MARKDOWN FORMATTING REQUIREMENTS:
- Use # for main section headers
- Use ## for subsection headers
- Use > for important notes or key points
- Use **bold** for emphasis on key terms
- Use \`code\` for mathematical terms or variables
- Use --- for section separators
- Use numbered lists (1., 2., etc.) for steps
- Use bullet points (•) for lists of items
- Use tables for organized data presentation
- Use proper indentation for nested lists
- Use \`\`\`math for multi-line mathematical expressions
- Use horizontal rules (---) to separate major sections

CRITICAL REQUIREMENTS:

# Problem Analysis:
- Identify the type of problem/exercise
- Understand all given information
- Recognize key concepts and requirements
- Identify formulas or methods needed
- Note any constraints or conditions

---

# Solution Structure:
1. Start with a clear problem statement
2. Break down the solution into clear, numbered steps
3. Show all work and calculations clearly
4. Explain each step thoroughly
5. Provide detailed reasoning
6. Provide the final answer clearly

---

# Mathematical Formatting:
## Inline Mathematics
- Use $formula$ for simple expressions
- Example: $x^2 + y^2 = z^2$

## Block Mathematics
- Use $$formula$$ for complex equations
- Example: $$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

## Matrix Formatting
\`\`\`math
\\begin{bmatrix} 
a & b \\\\
c & d
\\end{bmatrix}
\`\`\`

---

# Educational Value:
> Key Concepts:
- Explain the reasoning behind each step
- Highlight key concepts and principles
- Point out common pitfalls to avoid
- Include relevant tips or tricks
- Connect to related concepts when relevant

---

# Solution Quality:
## Accuracy
- Ensure mathematical accuracy
- Use proper notation and units
- Show alternative approaches if applicable
- Verify the answer makes sense

## Visual Elements
- Include necessary diagrams or graphs
- Use tables for data organization
- Use proper alignment for equations

---

# Output Format:
- Use clear section headings with proper hierarchy
- Format mathematical expressions properly
- Use bullet points for clarity
- Include step numbers where appropriate
- Maintain consistent formatting throughout

Return language: ${language}

IMPORTANT: Your ENTIRE response MUST be in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name} ONLY.
Do not use any other language in your response.`
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('Image size should be less than 10MB')
            return
        }

        setSelectedImage(file)
        setImagePreview(URL.createObjectURL(file))
        setError(null)
    }

    const handleSolve = async () => {
        if (!selectedImage && !exerciseText.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
            if (!geminiKey) {
                throw new Error('Gemini API key is not configured')
            }

            const ai = new GoogleGenAI({ apiKey: geminiKey })
            const model = ai.models
            const prompt = createSolverPrompt()
            const selectedLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'Vietnamese'

            let result;
            if (selectedImage) {
                // Convert image to base64
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => {
                        const base64 = reader.result as string
                        // Remove data URL prefix
                        const base64Content = base64.split(',')[1]
                        resolve(`data:${selectedImage.type};base64,${base64Content}`)
                    }
                    reader.onerror = reject
                    reader.readAsDataURL(selectedImage)
                })

                // Create image part
                const imagePart = await createPartFromUri(base64Data, selectedImage.type)

                // Generate content with image
                result = await model.generateContent({
                    model: selectedModel,
                    contents: createUserContent([
                        imagePart,
                        `${prompt}\n\nIMPORTANT: You MUST respond ONLY in ${selectedLanguage}. Do not use any other language in your response.`
                    ])
                })
            } else {
                // Generate content with text only
                result = await model.generateContent({
                    model: selectedModel,
                    contents: createUserContent([
                        `${prompt}\n\nIMPORTANT: You MUST respond ONLY in ${selectedLanguage}. Do not use any other language in your response.`,
                        `Bài tập:\n${exerciseText}`
                    ])
                })
            }

            const solution = result.text || 'No solution generated'
            setSolution(solution)
        } catch (error) {
            console.error('Solving error:', error)
            setError(error instanceof Error ? error.message : 'Failed to solve the exercise')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
        } catch (err) {
            console.error('Failed to copy text:', err)
        }
    }

    const handleDownload = (text: string) => {
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'solution.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Handle paste events
    const handlePaste = async (e: ClipboardEvent) => {
        if (!isPasteEnabled) return

        const items = e.clipboardData?.items
        if (!items) return

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault()
                const file = items[i].getAsFile()
                if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                        setError('Image size should be less than 10MB')
                        return
                    }
                    setSelectedImage(file)
                    setImagePreview(URL.createObjectURL(file))
                    setError(null)
                    return
                }
            }
        }
    }

    // Add effect to handle paste events
    useEffect(() => {
        window.addEventListener('paste', handlePaste)
        return () => window.removeEventListener('paste', handlePaste)
    }, [isPasteEnabled])

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                            <PhotoIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">AI Giải Bài Tập</h1>
                            <p className="text-sm text-gray-500">Tải lên hình ảnh bài tập và nhận giải pháp chi tiết</p>
                        </div>
                    </div>
                </div>

                {/* Options Bar */}
                <div className="flex flex-wrap items-center gap-4 p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model AI</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="gemini-2.5-flash-preview-04-17">Gemini 2.5 Flash (Preview)</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="explanation"
                            checked={needExplanation}
                            onChange={(e) => setNeedExplanation(e.target.checked)}
                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <label htmlFor="explanation" className="text-sm font-medium text-gray-700">
                            Giải thích chi tiết
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                    {/* Input Panel */}
                    <div className="p-6">
                        <div className="mb-4">
                            <h2 className="text-lg font-medium">Nhập bài tập</h2>
                            <p className="text-sm text-gray-500">Tải lên hình ảnh hoặc nhập nội dung bài tập</p>
                        </div>

                        {/* Input Type Selector */}
                        <div className="flex border-b mb-4">
                            <button
                                onClick={() => setInputType('image')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    inputType === 'image'
                                        ? 'border-b-2 border-black text-black'
                                        : 'text-gray-500 hover:text-black'
                                }`}
                            >
                                Hình ảnh
                            </button>
                            <button
                                onClick={() => setInputType('text')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    inputType === 'text'
                                        ? 'border-b-2 border-black text-black'
                                        : 'text-gray-500 hover:text-black'
                                }`}
                            >
                                Văn bản
                            </button>
                        </div>

                        {inputType === 'image' ? (
                            <>
                                <div
                                    ref={imageContainerRef}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative min-h-[300px] cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
                                        imagePreview ? 'border-transparent' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {imagePreview ? (
                                        <div className="relative h-full">
                                            <img
                                                src={imagePreview}
                                                alt="Xem trước bài tập"
                                                className="w-full h-full object-contain"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedImage(null)
                                                    setImagePreview(null)
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = ''
                                                    }
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                                <PhotoIcon className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <p className="text-sm font-medium">Nhấp để tải lên hoặc dán hình ảnh</p>
                                            <p className="text-xs text-gray-400 mt-1">Hỗ trợ: JPG, PNG, GIF (tối đa 10MB)</p>
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </>
                        ) : (
                            <div className="space-y-4">
                                <textarea
                                    ref={textAreaRef}
                                    value={exerciseText}
                                    onChange={(e) => setExerciseText(e.target.value)}
                                    placeholder="Nhập nội dung bài tập của bạn ở đây..."
                                    className="w-full h-[300px] p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
                                />
                                <div className="text-xs text-gray-500">
                                    * Hãy nhập đầy đủ nội dung bài tập, bao gồm các yêu cầu và dữ liệu cần thiết
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSolve}
                            disabled={(!selectedImage && !exerciseText.trim()) || isLoading}
                            className={`w-full mt-4 py-2.5 rounded-lg text-white font-medium transition-all ${
                                (!selectedImage && !exerciseText.trim()) || isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-black hover:bg-gray-900'
                            }`}
                        >
                            {isLoading ? 'Đang giải...' : 'Giải bài tập'}
                        </button>
                    </div>

                    {/* Solution Panel */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-medium">Lời giải</h2>
                                <p className="text-sm text-gray-500">Giải thích từng bước</p>
                            </div>
                            {solution && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopy(solution)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Sao chép vào clipboard"
                                    >
                                        <ClipboardDocumentIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDownload(solution)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Tải xuống lời giải"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="min-h-[400px] p-4 bg-gray-50 rounded-xl">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-4 border-black border-t-transparent animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 rounded-full border-4 border-black/30 border-t-transparent animate-spin" />
                                        </div>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <p className="text-sm font-medium text-gray-900">AI đang giải bài tập...</p>
                                        <p className="text-xs text-gray-500 mt-1">Vui lòng đợi trong giây lát</p>
                                    </div>
                                </div>
                            ) : solution ? (
                                <div className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-pre:bg-gray-50 prose-pre:p-2 prose-pre:rounded-lg">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {solution}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <p className="text-sm font-medium">Tải lên bài tập để bắt đầu</p>
                                    <p className="text-xs mt-1">AI sẽ cung cấp lời giải chi tiết từng bước</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}
        </div>
    )
} 