'use client'

import { useState, useEffect } from 'react'
import { BookOpen, RefreshCw, AlertCircle, ArrowRight, ArrowLeft, Sparkles, Check, Trophy } from 'lucide-react'
import { aiService } from '@/lib/ai-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Question {
    id: number;
    text: string;
    options: string[];
    correctIndex: number;
}

type TestLevel = '0-3.5' | '4.0-5.5' | '6.0-7.0' | '7.0-8.0' | '8.0-9.0';

const levelDescriptions = {
    '0-3.5': "Phù hợp cho người mới học tiếng Anh. Tập trung vào từ vựng cơ bản và ngữ pháp đơn giản (tương đương IELTS 0-3.5).",
    '4.0-5.5': "Dành cho người có kiến thức tiếng Anh trung bình. Bao gồm các cấu trúc câu phức tạp hơn và từ vựng đa dạng (tương đương IELTS 4.0-5.5).", 
    '6.0-7.0': "Dành cho người có trình độ tiếng Anh khá. Kiểm tra hiểu biết sâu về ngôn ngữ, thành ngữ và ngữ cảnh (tương đương IELTS 6.0-7.0).",
    '7.0-8.0': "Dành cho người có trình độ tiếng Anh giỏi. Kiểm tra khả năng sử dụng ngôn ngữ học thuật và thành ngữ nâng cao (tương đương IELTS 7.0-8.0).",
    '8.0-9.0': "Dành cho người thành thạo tiếng Anh. Kiểm tra khả năng sử dụng ngôn ngữ học thuật chuyên sâu và phức tạp (tương đương IELTS 8.0-9.0)."
};

export default function EnglishTest() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [result, setResult] = useState<{
        score: number;
        correctAnswers: number;
        totalQuestions: number;
        explanation: string;
        level: TestLevel;
        estimatedIelts: number;
    } | null>(null)
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [testStarted, setTestStarted] = useState(false)
    const [isNavigationDisabled, setIsNavigationDisabled] = useState(false)
    const [selectedLevel, setSelectedLevel] = useState<TestLevel>('4.0-5.5')

    const generateQuestions = async () => {
        setTestStarted(true)
        setGenerating(true)
        setError(null)
        setQuestions([])
        setAnswers({})
        setResult(null)
        setCurrentQuestionIndex(0)

        try {
            const levelText = {
                '0-3.5': "cơ bản (IELTS 0-3.5)", 
                '4.0-5.5': "trung cấp (IELTS 4.0-5.5)",
                '6.0-7.0': "khá (IELTS 6.0-7.0)",
                '7.0-8.0': "giỏi (IELTS 7.0-8.0)", 
                '8.0-9.0': "xuất sắc (IELTS 8.0-9.0)"
            }[selectedLevel];

            const promptByLevel = {
                '0-3.5': `Từ vựng cơ bản, câu đơn giản, thì hiện tại đơn, hiện tại tiếp diễn, quá khứ đơn.`,
                '4.0-5.5': `Từ vựng trung bình, thành ngữ thông dụng, các thì quá khứ, tương lai, hiện tại hoàn thành.`, 
                '6.0-7.0': `Từ vựng học thuật cơ bản, thành ngữ thông dụng, cấu trúc câu phức tạp đơn giản, phrasal verbs cơ bản.`,
                '7.0-8.0': `Từ vựng học thuật nâng cao, thành ngữ phức tạp, cấu trúc câu phức tạp, phrasal verbs và idioms đa dạng.`,
                '8.0-9.0': `Từ vựng học thuật chuyên sâu, thành ngữ và idioms phức tạp, cấu trúc câu phức tạp cao cấp, collocations.`
            }[selectedLevel];

            const prompt = `Tạo ra 10 câu hỏi trắc nghiệm để kiểm tra trình độ tiếng Anh ${levelText}.

Yêu cầu:
- Mỗi câu hỏi đều là trắc nghiệm với 4 lựa chọn
- Mỗi câu hỏi phải có một đáp án đúng
- Các câu hỏi nên đa dạng gồm: từ vựng, ngữ pháp, đọc hiểu, phrasal verbs
- Điều chỉnh độ khó phù hợp với trình độ ${levelText}
- ${promptByLevel}

Ví dụ cấu trúc câu hỏi:
1. "What is the meaning of 'ubiquitous'?"
2. "Choose the correct form: She ____ to the store yesterday."
3. "Which sentence uses the correct tense?"
4. "Select the best word to complete this sentence."

Trả về kết quả dưới dạng JSON với định dạng sau:
{
  "questions": [
    {
      "id": 1,
      "text": "Nội dung câu hỏi",
      "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
      "correctIndex": 0 (đáp án đúng, từ 0-3)
    },
    ...
  ]
}

Chỉ trả về JSON, không thêm giải thích hay chú thích.`

            const response = await aiService.processWithAI(prompt)

            try {
                // Extract JSON from response
                const jsonMatch = response.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                    const jsonResponse = JSON.parse(jsonMatch[0])
                    if (jsonResponse.questions && Array.isArray(jsonResponse.questions)) {
                        setQuestions(jsonResponse.questions)
                    } else {
                        throw new Error('Định dạng kết quả không hợp lệ')
                    }
                } else {
                    throw new Error('Không thể phân tích kết quả')
                }
            } catch (parseError) {
                console.error('Parse error:', parseError)
                setError('Không thể tạo câu hỏi. Vui lòng thử lại.')
            }
        } catch (err) {
            console.error('English Test error:', err)
            setError('Đã xảy ra lỗi khi tạo câu hỏi. Vui lòng thử lại sau.')
        } finally {
            setGenerating(false)
        }
    }

    const handleAnswerChange = (questionId: number, optionIndex: number) => {
        // Disable navigation temporarily
        setIsNavigationDisabled(true)

        // Update answers
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }))

        // Auto-advance to next question after a short delay
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1)
            }
            // Re-enable navigation after advancing
            setIsNavigationDisabled(false)
        }, 600)
    }

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0 && !isNavigationDisabled) {
            setCurrentQuestionIndex(currentQuestionIndex - 1)
        }
    }

    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1 && !isNavigationDisabled) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
        }
    }

    const goToQuestion = (index: number) => {
        if (!isNavigationDisabled) {
            setCurrentQuestionIndex(index);
        }
    }

    const calculateResult = async () => {
        if (Object.keys(answers).length < questions.length) {
            setError('Vui lòng trả lời tất cả các câu hỏi trước khi xem kết quả')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Calculate score
            let correctAnswers = 0;
            
            questions.forEach(question => {
                const userAnswer = answers[question.id];
                if (userAnswer === question.correctIndex) {
                    correctAnswers++;
                }
            });

            const percentage = Math.round((correctAnswers / questions.length) * 100);
            
            // Estimate IELTS score based on percentage and selected level
            let estimatedIelts = 0;
            
            if (selectedLevel === '0-3.5') {
                // Range 0-3.5 based on percentage
                estimatedIelts = (percentage / 100) * 3.5;
            } else if (selectedLevel === '4.0-5.5') {
                // Range 4.0-5.5 based on percentage
                estimatedIelts = 4.0 + (percentage / 100) * 1.5;
            } else {
                // Range 6.0-9.0 based on percentage
                estimatedIelts = 6.0 + (percentage / 100) * 3.0;
            }
            
            // Round to nearest 0.5
            estimatedIelts = Math.round(estimatedIelts * 2) / 2;

            // Get AI explanation
            const answerDetails = questions.map(q => {
                const userAnswerIndex = answers[q.id];
                const isCorrect = userAnswerIndex === q.correctIndex;
                return `Câu hỏi: ${q.text}\nLựa chọn của người dùng: ${q.options[userAnswerIndex]}\nĐáp án đúng: ${q.options[q.correctIndex]}\nKết quả: ${isCorrect ? 'Đúng' : 'Sai'}`;
            }).join('\n\n');

            const prompt = `Dưới đây là kết quả bài kiểm tra tiếng Anh trình độ ${selectedLevel} của một người. 
Họ đã trả lời đúng ${correctAnswers}/${questions.length} câu hỏi (đạt ${percentage}%).
Điểm IELTS ước tính: ${estimatedIelts}

Chi tiết câu trả lời:
${answerDetails}

Viết một đoạn phân tích ngắn, tích cực về kết quả này khoảng 3-4 câu. 
Đoạn phân tích nên:
- Đánh giá trình độ tiếng Anh dựa trên điểm số và điểm IELTS ước tính
- Đưa ra nhận xét về thế mạnh/điểm yếu (nếu thấy rõ qua bài làm)
- Đề xuất 1-2 hướng cải thiện cụ thể
- Có giọng điệu khích lệ, tích cực

Chỉ trả về đoạn phân tích, không thêm tiêu đề hay kết luận.`

            const explanation = await aiService.processWithAI(prompt)

            setResult({
                score: percentage,
                correctAnswers,
                totalQuestions: questions.length,
                explanation,
                level: selectedLevel,
                estimatedIelts
            })
        } catch (err) {
            console.error('Result calculation error:', err)
            setError('Đã xảy ra lỗi khi tính kết quả. Vui lòng thử lại sau.')
        } finally {
            setLoading(false)
        }
    }

    const restartTest = () => {
        setResult(null)
        setAnswers({})
        setCurrentQuestionIndex(0)
        setTestStarted(false)
        window.scrollTo(0, 0)
    }

    const getLevelColor = (level: TestLevel) => {
        switch (level) {
            case '0-3.5': return 'from-green-400 to-green-600';
            case '4.0-5.5': return 'from-blue-400 to-blue-600';
            case '6.0-7.0': return 'from-purple-400 to-purple-600';
            case '7.0-8.0': return 'from-red-400 to-red-600';
            case '8.0-9.0': return 'from-red-400 to-red-600';
            default: return 'from-blue-400 to-blue-600';
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 90) return "#22c55e" // Green
        if (score >= 75) return "#16a34a" // Dark Green
        if (score >= 60) return "#2563eb" // Blue
        if (score >= 45) return "#3b82f6" // Light Blue
        if (score >= 30) return "#f59e0b" // Yellow
        return "#ef4444" // Red
    }

    const getScoreLabel = (score: number, level: TestLevel, ieltsScore: number) => {
        let prefix = '';
        
        if (score >= 90) prefix = "Xuất sắc";
        else if (score >= 75) prefix = "Giỏi";
        else if (score >= 60) prefix = "Khá";
        else if (score >= 45) prefix = "Trung bình";
        else if (score >= 30) prefix = "Yếu";
        else prefix = "Kém";
        
        return `IELTS: ${ieltsScore.toFixed(1)} - ${prefix}`;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const allQuestionsAnswered = Object.keys(answers).length === questions.length;

    return (
        <div className="mx-auto px-2 py-8 max-w-3xl">
            <Card className="shadow-md">
                <CardHeader className={`bg-gradient-to-r ${getLevelColor(selectedLevel)}`}>
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-white">
                        <BookOpen className="h-6 w-6" />
                        English Proficiency Test
                    </CardTitle>
                    <CardDescription className="text-white/90">
                        Kiểm tra trình độ tiếng Anh của bạn với các câu hỏi được tùy chỉnh theo điểm IELTS
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-50 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!testStarted && !result && (
                        <div className="flex flex-col items-center justify-center p-10 text-center space-y-6">
                            <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getLevelColor(selectedLevel)} flex items-center justify-center`}>
                                <Sparkles className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Kiểm tra trình độ tiếng Anh</h2>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    Trả lời 10 câu hỏi để đánh giá trình độ tiếng Anh của bạn.
                                    Các câu hỏi được điều chỉnh theo cấp độ IELTS mà bạn chọn.
                                </p>
                            </div>
                            
                            <div className="w-full max-w-md space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="level-select">Chọn khoảng điểm IELTS:</Label>
                                    <Select 
                                        value={selectedLevel} 
                                        onValueChange={(value: TestLevel) => setSelectedLevel(value)}
                                    >
                                        <SelectTrigger id="level-select" className="w-full">
                                            <SelectValue placeholder="Chọn khoảng điểm IELTS" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0-3.5">IELTS 0 - 3.5 (Beginner)</SelectItem>
                                            <SelectItem value="4.0-5.5">IELTS 4.0 - 5.5 (Intermediate)</SelectItem>
                                            <SelectItem value="6.0-7.0">IELTS 6.0 - 7.0 (Upper Intermediate)</SelectItem>
                                            <SelectItem value="7.0-8.0">IELTS 7.0 - 8.0 (Expert)</SelectItem>
                                            <SelectItem value="8.0-9.0">IELTS 8.0 - 9.0 (Master)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                                    {levelDescriptions[selectedLevel]}
                                </div>
                                
                                <Button
                                    onClick={generateQuestions}
                                    className={`w-full bg-gradient-to-r ${getLevelColor(selectedLevel)} hover:opacity-90 text-white px-8 text-lg font-bold`}
                                    size="lg"
                                >
                                    Bắt đầu Test
                                </Button>
                            </div>
                        </div>
                    )}

                    {generating && (
                        <div className="space-y-2 p-8 flex flex-col items-center">
                            <RefreshCw className={`h-6 w-6 animate-spin text-${selectedLevel === '0-3.5' ? 'green' : selectedLevel === '4.0-5.5' ? 'blue' : 'purple'}-500`} />
                            <span className="text-sm font-medium">Đang tạo câu hỏi...</span>
                        </div>
                    )}

                    {testStarted && !result && !generating && questions.length > 0 && (
                        <div className="space-y-4">
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${getLevelColor(selectedLevel)}`}
                                    style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                                ></div>
                            </div>

                            <div className="text-sm text-gray-500 flex justify-between mb-2">
                                <span>Câu hỏi {currentQuestionIndex + 1}/{questions.length}</span>
                                <span>{Object.keys(answers).length}/{questions.length} đã trả lời</span>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                {questions.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToQuestion(index)}
                                        disabled={isNavigationDisabled}
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                                            answers[questions[index].id] !== undefined
                                                ? "bg-green-100 text-green-800 border-2 border-green-300"
                                                : "bg-gray-100 text-gray-800 border-2 border-gray-300",
                                            currentQuestionIndex === index && "ring-2 ring-offset-2 ring-blue-500",
                                            isNavigationDisabled && "opacity-70 cursor-not-allowed"
                                        )}
                                    >
                                        {index + 1}
                                        {answers[questions[index].id] !== undefined && (
                                            <Check className="absolute h-2 w-2 top-0 right-0 text-green-600" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {currentQuestion && (
                                <div className="space-y-4 border rounded-lg p-4 shadow-sm">
                                    <h3 className="font-medium text-lg">
                                        {currentQuestion.text}
                                    </h3>
                                    <RadioGroup
                                        value={answers[currentQuestion.id]?.toString() || ''}
                                        onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
                                        className="space-y-3 pl-2"
                                    >
                                        {currentQuestion.options.map((option, optIndex) => (
                                            <div key={optIndex}
                                                className={cn(
                                                    "flex items-center space-x-2 p-2 rounded-md transition-colors",
                                                    isNavigationDisabled && answers[currentQuestion.id] === optIndex
                                                        ? `bg-${selectedLevel === '0-3.5' ? 'green' : selectedLevel === '4.0-5.5' ? 'blue' : 'purple'}-50 border border-${selectedLevel === '0-3.5' ? 'green' : selectedLevel === '4.0-5.5' ? 'blue' : 'purple'}-200`
                                                        : "hover:bg-gray-50"
                                                )}
                                            >
                                                <RadioGroupItem
                                                    value={optIndex.toString()}
                                                    id={`q${currentQuestion.id}-opt${optIndex}`}
                                                    disabled={isNavigationDisabled}
                                                />
                                                <Label
                                                    htmlFor={`q${currentQuestion.id}-opt${optIndex}`}
                                                    className={cn(
                                                        "cursor-pointer w-full",
                                                        isNavigationDisabled && answers[currentQuestion.id] === optIndex && "font-medium"
                                                    )}
                                                >
                                                    {option}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={goToPreviousQuestion}
                                    disabled={currentQuestionIndex === 0 || isNavigationDisabled}
                                    className="flex items-center gap-1"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Quay lại
                                </Button>

                                {currentQuestionIndex === questions.length - 1 ? (
                                    <Button
                                        onClick={calculateResult}
                                        disabled={loading || !allQuestionsAnswered || isNavigationDisabled}
                                        className={`bg-gradient-to-r ${getLevelColor(selectedLevel)} text-white hover:opacity-90`}
                                    >
                                        {loading ? 'Đang tính điểm...' : 'Xem kết quả'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={goToNextQuestion}
                                        disabled={isNavigationDisabled}
                                        className="flex items-center gap-1"
                                    >
                                        Tiếp theo <ArrowRight className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="space-y-2 p-8 flex flex-col items-center">
                            <RefreshCw className={`h-6 w-6 animate-spin text-${selectedLevel === '0-3.5' ? 'green' : selectedLevel === '4.0-5.5' ? 'blue' : 'purple'}-500`} />
                            <span className="text-sm font-medium">Đang tính điểm...</span>
                            <Progress value={75} className="h-1 w-32" />
                        </div>
                    )}

                    {result && (
                        <div className={`p-4 rounded-md bg-gradient-to-r from-${selectedLevel === '0-3.5' ? 'green' : selectedLevel === '4.0-5.5' ? 'blue' : 'purple'}-50 to-${selectedLevel === '0-3.5' ? 'green' : selectedLevel === '4.0-5.5' ? 'blue' : 'purple'}-100`}>
                            <div className="flex flex-col items-center mb-6">
                                <span className="text-2xl font-bold" style={{ color: getScoreColor(result.score) }}>
                                    {getScoreLabel(result.score, result.level, result.estimatedIelts)}
                                </span>
                                
                                <div className="relative w-36 h-36 rounded-full flex items-center justify-center bg-white mb-4 shadow-lg">
                                    <svg className="w-36 h-36 absolute" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="42"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="12"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="42"
                                            fill="none"
                                            stroke={getScoreColor(result.score)}
                                            strokeWidth="14"
                                            strokeDasharray={`${2 * Math.PI * 42 * result.score / 100} ${2 * Math.PI * 42 * (100 - result.score) / 100}`}
                                            strokeDashoffset={2 * Math.PI * 42 * 25 / 100}
                                            transform="rotate(-90 50 50)"
                                        />
                                    </svg>
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl font-bold" style={{ color: getScoreColor(result.score), textShadow: "0px 0px 2px rgba(0,0,0,0.1)" }}>
                                            {result.estimatedIelts.toFixed(1)}
                                        </span>
                                        <span className="text-sm text-gray-500">IELTS</span>
                                    </div>
                                </div>

                                <div className="text-base text-gray-700 p-5 bg-white/70 rounded-md w-full shadow-sm">
                                    <p className="font-medium text-center">{result.explanation}</p>
                                </div>

                                {/* Review all questions section */}
                                <div className="w-full mt-6">
                                    <h3 className="font-semibold text-lg mb-4 text-center">Xem lại tất cả câu hỏi và đáp án</h3>
                                    <div className="space-y-4">
                                        {questions.map((question, idx) => {
                                            const userAnswer = answers[question.id];
                                            const isCorrect = userAnswer === question.correctIndex;
                                            
                                            return (
                                                <div 
                                                    key={question.id} 
                                                    className={cn(
                                                        "border rounded-md p-4",
                                                        isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                                                    )}
                                                >
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-medium">Câu {idx + 1}</span>
                                                        <span className={cn(
                                                            "text-sm px-2 py-0.5 rounded-full",
                                                            isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                        )}>
                                                            {isCorrect ? "Đúng" : "Sai"}
                                                        </span>
                                                    </div>
                                                    
                                                    <p className="text-gray-800 mb-3">{question.text}</p>
                                                    
                                                    <div className="space-y-2">
                                                        {question.options.map((option, optIdx) => (
                                                            <div 
                                                                key={optIdx}
                                                                className={cn(
                                                                    "flex items-start p-2 rounded-md",
                                                                    optIdx === question.correctIndex && optIdx === userAnswer && "bg-green-100 border border-green-300",
                                                                    optIdx === question.correctIndex && optIdx !== userAnswer && "bg-green-100 border border-green-300",
                                                                    optIdx !== question.correctIndex && optIdx === userAnswer && "bg-red-100 border border-red-300",
                                                                    optIdx !== question.correctIndex && optIdx !== userAnswer && "bg-gray-50"
                                                                )}
                                                            >
                                                                <div className="flex-shrink-0 mt-0.5 mr-2">
                                                                    {optIdx === userAnswer && optIdx === question.correctIndex && (
                                                                        <Check className="h-5 w-5 text-green-600" />
                                                                    )}
                                                                    {optIdx === userAnswer && optIdx !== question.correctIndex && (
                                                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                                                    )}
                                                                    {optIdx === question.correctIndex && optIdx !== userAnswer && (
                                                                        <Check className="h-5 w-5 text-green-600" />
                                                                    )}
                                                                    {optIdx !== question.correctIndex && optIdx !== userAnswer && (
                                                                        <div className="h-5 w-5 rounded-full border border-gray-300" />
                                                                    )}
                                                                </div>
                                                                <span className={cn(
                                                                    "text-sm",
                                                                    optIdx === question.correctIndex && "font-medium",
                                                                )}>
                                                                    {option}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                    <Button
                                        onClick={restartTest}
                                        className={`bg-gradient-to-r ${getLevelColor(selectedLevel)} text-white hover:opacity-90 px-6 font-bold`}
                                        size="lg"
                                    >
                                        Làm lại bài test
                                    </Button>
                                    
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setResult(null);
                                            setAnswers({});
                                            setCurrentQuestionIndex(0);
                                            setTestStarted(false);
                                            window.scrollTo(0, 0);
                                        }}
                                        className="flex items-center gap-1"
                                    >
                                        <RefreshCw className="h-4 w-4" /> Thay đổi cấp độ
                                    </Button>
                                </div>
                            </div>

                            <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-4">
                                <h3 className="text-lg font-medium mb-2 text-center">Thông tin điểm IELTS</h3>
                                <div className="grid grid-cols-9 gap-1 mb-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(band => {
                                        const isActive = band <= Math.floor(result.estimatedIelts);
                                        const isPartial = band === Math.ceil(result.estimatedIelts) && band > Math.floor(result.estimatedIelts);
                                        
                                        return (
                                            <div 
                                                key={band}
                                                className={cn(
                                                    "h-10 flex items-center justify-center rounded-md text-sm font-medium",
                                                    isActive && selectedLevel === '0-3.5' && "bg-green-500 text-white",
                                                    isActive && selectedLevel === '4.0-5.5' && "bg-blue-500 text-white",
                                                    isActive && selectedLevel === '6.0-7.0' && "bg-purple-500 text-white", 
                                                    isActive && selectedLevel === '7.0-8.0' && "bg-purple-500 text-white",
                                                    isActive && selectedLevel === '8.0-9.0' && "bg-purple-500 text-white",
                                                    isPartial && selectedLevel === '0-3.5' && "bg-green-200 text-gray-800",
                                                    isPartial && selectedLevel === '4.0-5.5' && "bg-blue-200 text-gray-800",
                                                    isPartial && selectedLevel === '6.0-7.0' && "bg-purple-200 text-gray-800",
                                                    isPartial && selectedLevel === '7.0-8.0' && "bg-purple-200 text-gray-800",
                                                    isPartial && selectedLevel === '8.0-9.0' && "bg-purple-200 text-gray-800",
                                                    !isActive && !isPartial && "bg-gray-100 text-gray-500"
                                                )}
                                            >
                                                {band}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-sm text-gray-600 space-y-2">
                                    <div className="flex justify-between">
                                        <span>1-3: Người mới bắt đầu</span>
                                        <span>4-5: Trung cấp thấp</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>6-7: Trung cấp cao</span>
                                        <span>8-9: Thành thạo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 