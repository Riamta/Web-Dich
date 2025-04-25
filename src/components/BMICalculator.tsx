'use client'

import { useState } from 'react'
import { Scale, Ruler, Activity, Heart, Info, Bot, Calculator } from 'lucide-react'
import { aiService } from '@/lib/ai-service'
import ReactMarkdown from 'react-markdown'

interface BMIResult {
    bmi: number
    category: string
    healthyWeightRange: {
        min: number
        max: number
    }
    risks: string[]
    recommendations: string[]
    aiAdvice: string
    bodyAge: number
    predictedLifeExpectancy: number
    healthScore: number
}

const bmiCategories = [
    { range: [0, 18.5], category: 'Thiếu cân', color: 'text-blue-600' },
    { range: [18.5, 24.9], category: 'Bình thường', color: 'text-green-600' },
    { range: [25, 29.9], category: 'Thừa cân', color: 'text-yellow-600' },
    { range: [30, 34.9], category: 'Béo phì cấp độ I', color: 'text-orange-600' },
    { range: [35, 39.9], category: 'Béo phì cấp độ II', color: 'text-red-600' },
    { range: [40, Infinity], category: 'Béo phì cấp độ III', color: 'text-red-800' }
]

const healthRisks = {
    underweight: [
        'Suy dinh dưỡng',
        'Hệ miễn dịch yếu',
        'Loãng xương',
        'Thiếu máu'
    ],
    normal: [
        'Nguy cơ thấp',
        'Sức khỏe tốt',
        'Duy trì lối sống lành mạnh'
    ],
    overweight: [
        'Bệnh tim mạch',
        'Tiểu đường type 2',
        'Huyết áp cao',
        'Đột quỵ'
    ],
    obese: [
        'Bệnh tim mạch nặng',
        'Tiểu đường type 2',
        'Huyết áp cao',
        'Đột quỵ',
        'Một số bệnh ung thư',
        'Vấn đề về khớp'
    ]
}

const recommendations = {
    underweight: [
        'Ăn nhiều bữa nhỏ trong ngày',
        'Tăng cường thực phẩm giàu dinh dưỡng',
        'Tập thể dục nhẹ nhàng',
        'Ngủ đủ giấc'
    ],
    normal: [
        'Duy trì chế độ ăn cân bằng',
        'Tập thể dục thường xuyên',
        'Kiểm tra sức khỏe định kỳ',
        'Ngủ đủ giấc'
    ],
    overweight: [
        'Giảm lượng calo nạp vào',
        'Tăng cường vận động',
        'Ăn nhiều rau xanh',
        'Hạn chế đồ ngọt và chất béo'
    ],
    obese: [
        'Tham khảo ý kiến bác sĩ',
        'Theo dõi chế độ ăn nghiêm ngặt',
        'Tập thể dục thường xuyên',
        'Thay đổi lối sống'
    ]
}

export default function BMICalculator() {
    const [height, setHeight] = useState<string>('')
    const [weight, setWeight] = useState<string>('')
    const [age, setAge] = useState<string>('')
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [bmiResult, setBmiResult] = useState<BMIResult | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const getHealthInfo = async (bmi: number, category: string, height: number, age?: number, gender?: string) => {
        setIsLoading(true)
        try {
            // Kiểm tra và điều chỉnh BMI nếu quá cao
            const adjustedBmi = Math.min(bmi, 100) // Giới hạn BMI tối đa là 100
            const adjustedCategory = adjustedBmi >= 100 ? 'Béo phì nghiêm trọng' : category

            const prompt = `Bạn là một chuyên gia dinh dưỡng và sức khỏe. Dựa trên chỉ số BMI ${adjustedBmi}, phân loại ${adjustedCategory}, chiều cao ${height}cm${age ? ` và tuổi ${age}` : ''}, giới tính ${gender === 'male' ? 'nam' : 'nữ'}, hãy đưa ra thông tin sức khỏe ngắn gọn và súc tích.

Yêu cầu trả về JSON với cấu trúc sau:
{
    "healthyWeightRange": {
        "min": số kg tối thiểu (chỉ trả về số),
        "max": số kg tối đa (chỉ trả về số)
    },
    "risks": [
        "một vài nguy cơ sức khỏe chính nếu có"
    ],
    "recommendations": [
        "một vài khuyến nghị quan trọng nhất nếu có"
    ],
    "aiAdvice": "Lời khuyên ngắn gọn về sức khỏe, sử dụng markdown để định dạng",
    "bodyAge": số tuổi cơ thể (chỉ trả về số),
    "predictedLifeExpectancy": số tuổi dự đoán có thể sống (chỉ trả về số),
    "healthScore": số điểm đánh giá sức khỏe từ 0-100 (chỉ trả về số)
}

Yêu cầu nội dung:
1. Cân nặng lý tưởng: chỉ trả về số kg, không kèm theo text
2. Nguy cơ sức khỏe ngắn gọn và quan trọng nhất
3. Khuyến nghị thực tế và khả thi
4. Lời khuyên AI ngắn gọn bao gồm:
   - Tình trạng sức khỏe
   - Chế độ ăn uống
   - Vận động
   - Lời khuyên quan trọng
5. Tuổi cơ thể dựa trên BMI và chiều cao${age ? ' (so sánh với tuổi thực tế)' : ''}
6. Dự đoán tuổi thọ dựa trên các chỉ số sức khỏe${age ? ' và tuổi thực tế' : ''}
7. Đánh giá điểm sức khỏe từ 0-100 dựa trên:
   - BMI (nếu BMI > 50, điểm sức khỏe phải < 30)
   - Cân nặng lý tưởng
   - Nguy cơ sức khỏe
   - Tuổi cơ thể${age ? ' và tuổi thực tế' : ''}
   - Tuổi thọ dự đoán (nếu BMI > 50, tuổi thọ dự đoán phải < 60)

Lưu ý quan trọng:
- Nếu BMI > 50: điểm sức khỏe phải < 30 và tuổi thọ dự đoán < 60 tuổi
- Nếu BMI > 70: điểm sức khỏe phải < 20 và tuổi thọ dự đoán < 50 tuổi
- Nếu BMI > 90: điểm sức khỏe phải < 10 và tuổi thọ dự đoán < 40 tuổi

Hãy viết ngắn gọn, dễ hiểu và sử dụng markdown để định dạng.`;

            const response = await aiService.processWithAI(prompt)
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/)
                if (!jsonMatch) {
                    throw new Error('Không tìm thấy JSON trong phản hồi')
                }
                const healthInfo = JSON.parse(jsonMatch[0])
                return healthInfo
            } catch (error) {
                console.error('Error parsing AI response:', error)
                throw new Error('Không thể phân tích phản hồi từ AI')
            }
        } catch (error) {
            console.error('Error getting health info:', error)
            throw new Error('Không thể tải thông tin sức khỏe')
        } finally {
            setIsLoading(false)
        }
    }

    const calculateBMI = async () => {
        if (!height || !weight) return

        const heightInMeters = Number(height) / 100
        const weightInKg = Number(weight)
        const ageInYears = age ? Number(age) : undefined
        
        if (!heightInMeters || !weightInKg) return null

        const bmi = weightInKg / (heightInMeters * heightInMeters)
        const category = bmiCategories.find(cat => 
            bmi >= cat.range[0] && bmi < cat.range[1]
        )?.category || 'Không xác định'

        // Hiển thị kết quả BMI cơ bản trước
        const basicResult = {
            bmi: Number(bmi.toFixed(1)),
            category,
            healthyWeightRange: {
                min: 0,
                max: 0
            },
            risks: ['Đang tải thông tin nguy cơ...'],
            recommendations: ['Đang tải khuyến nghị...'],
            aiAdvice: 'Đang tải lời khuyên từ AI...',
            bodyAge: 0,
            predictedLifeExpectancy: 0,
            healthScore: 0
        }
        setBmiResult(basicResult)

        // Sau đó tải thông tin chi tiết từ AI
        try {
            const healthInfo = await getHealthInfo(Number(bmi.toFixed(1)), category, Number(height), ageInYears, gender)
            setBmiResult({
                ...basicResult,
                ...healthInfo
            })
        } catch (error) {
            console.error('Error getting AI advice:', error)
            setBmiResult({
                ...basicResult,
                risks: ['Không thể tải thông tin nguy cơ'],
                recommendations: ['Không thể tải thông tin khuyến nghị'],
                aiAdvice: 'Xin lỗi, không thể tải lời khuyên từ AI. Vui lòng thử lại sau.'
            })
        }
    }

    const handleInputChange = (type: 'height' | 'weight' | 'age' | 'gender', value: string) => {
        if (type === 'height') {
            setHeight(value)
        } else if (type === 'weight') {
            setWeight(value)
        } else if (type === 'age') {
            setAge(value)
        } else if (type === 'gender') {
            setGender(value as 'male' | 'female')
        }
        setBmiResult(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            calculateBMI()
        }
    }

    const getHealthScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-700'
        if (score >= 60) return 'bg-green-50 text-green-600'
        if (score >= 40) return 'bg-yellow-50 text-yellow-600'
        if (score >= 20) return 'bg-orange-50 text-orange-600'
        return 'bg-red-50 text-red-600'
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">Tính chỉ số BMI</h2>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Chiều cao (cm)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => handleInputChange('height', e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nhập chiều cao"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                                <Ruler className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cân nặng (kg)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => handleInputChange('weight', e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nhập cân nặng"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                                <Scale className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tuổi (tùy chọn)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => handleInputChange('age', e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nhập tuổi"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                                <Activity className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Giới tính
                            </label>
                            <div className="relative">
                                <select
                                    value={gender}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                >
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={calculateBMI}
                            disabled={!height || !weight || isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Calculator className="w-5 h-5" />
                            Tính BMI
                        </button>
                    </div>

                    {bmiResult && (
                        <div className="space-y-6">
                            <div className="p-4 bg-gray-50 rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-5 h-5" />
                                        <span className="font-medium">Kết quả BMI</span>
                                    </div>
                                    <div className={`${getHealthScoreColor(bmiResult.healthScore)} w-16 h-16 rounded-full flex flex-col items-center justify-center`}>
                                        <div className="text-xl font-bold">{bmiResult.healthScore}</div>
                                        <div className="text-xs">điểm</div>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold">
                                    {bmiResult.bmi}
                                </div>
                                <div className="text-lg font-medium">
                                    {bmiResult.category}
                                </div>
                                <div className="mt-2 space-y-1">
                                    <div className="text-sm text-gray-600">
                                        Tuổi cơ thể: {bmiResult.bodyAge} tuổi
                                        {age && ` (Tuổi thực: ${age} tuổi)`}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Tuổi thọ dự đoán: {bmiResult.predictedLifeExpectancy} tuổi
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-md">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Heart className="w-5 h-5" />
                                            <span className="font-medium">Cân nặng lý tưởng</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div>Từ {bmiResult.healthyWeightRange.min} kg</div>
                                            <div>Đến {bmiResult.healthyWeightRange.max} kg</div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-md">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info className="w-5 h-5" />
                                            <span className="font-medium">Nguy cơ sức khỏe</span>
                                            {isLoading && (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 ml-2"></div>
                                            )}
                                        </div>
                                        <ul className="list-disc list-inside space-y-1">
                                            {bmiResult.risks.map((risk, index) => (
                                                <li key={index}>{risk}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-md">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info className="w-5 h-5" />
                                            <span className="font-medium">Khuyến nghị</span>
                                            {isLoading && (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 ml-2"></div>
                                            )}
                                        </div>
                                        <ul className="list-disc list-inside space-y-1">
                                            {bmiResult.recommendations.map((rec, index) => (
                                                <li key={index}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-md">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Bot className="w-5 h-5" />
                                            <span className="font-medium">Tư vấn AI</span>
                                            {isLoading && (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 ml-2"></div>
                                            )}
                                        </div>
                                        <div className="prose max-w-none">
                                            <ReactMarkdown>{bmiResult.aiAdvice}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 