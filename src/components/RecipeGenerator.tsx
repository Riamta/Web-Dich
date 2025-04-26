'use client'

import { useState } from 'react'
import { BeakerIcon, ClockIcon, UsersIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'
import ReactMarkdown from 'react-markdown'

interface Recipe {
    name: string
    description: string
    ingredients: string[]
    steps: string[]
    cookingTime: string
    servings: string
    difficulty: string
    tips: string[]
    nutritionInfo: {
        calories: string
        protein: string
        carbs: string
        fat: string
    }
    healthScore?: {
        score: number
        details: string[]
    }
}

export default function RecipeGenerator() {
    const [dishName, setDishName] = useState<string>('')
    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')

    const calculateHealthScore = (nutritionInfo: Recipe['nutritionInfo'], servings: string): Recipe['healthScore'] => {
        // Chuyển đổi các giá trị dinh dưỡng thành số
        const calories = parseInt(nutritionInfo.calories.replace(/[^0-9]/g, ''))
        const protein = parseInt(nutritionInfo.protein.replace(/[^0-9]/g, ''))
        const carbs = parseInt(nutritionInfo.carbs.replace(/[^0-9]/g, ''))
        const fat = parseInt(nutritionInfo.fat.replace(/[^0-9]/g, ''))
        const servingsNum = parseInt(servings.replace(/[^0-9]/g, '')) || 1

        const details: string[] = []
        let score = 70 // Điểm cơ bản

        // Tính toán calories trên mỗi phần ăn
        const caloriesPerServing = calories / servingsNum
        if (caloriesPerServing <= 500) {
            score += 10
            details.push('✓ Lượng calories phù hợp cho một bữa ăn')
        } else if (caloriesPerServing > 800) {
            score -= 10
            details.push('⚠️ Lượng calories cao cho một bữa ăn')
        }

        // Đánh giá tỷ lệ protein
        const proteinCalories = protein * 4
        const proteinRatio = (proteinCalories / calories) * 100
        if (proteinRatio >= 20) {
            score += 10
            details.push('✓ Giàu protein, tốt cho cơ bắp')
        } else if (proteinRatio < 10) {
            score -= 5
            details.push('⚠️ Lượng protein thấp')
        }

        // Đánh giá tỷ lệ carbs
        const carbsCalories = carbs * 4
        const carbsRatio = (carbsCalories / calories) * 100
        if (carbsRatio >= 45 && carbsRatio <= 65) {
            score += 5
            details.push('✓ Tỷ lệ carbs cân đối')
        } else if (carbsRatio > 65) {
            score -= 5
            details.push('⚠️ Lượng carbs cao')
        }

        // Đánh giá tỷ lệ chất béo
        const fatCalories = fat * 9
        const fatRatio = (fatCalories / calories) * 100
        if (fatRatio <= 30) {
            score += 5
            details.push('✓ Lượng chất béo hợp lý')
        } else if (fatRatio > 35) {
            score -= 10
            details.push('⚠️ Lượng chất béo cao')
        }

        // Giới hạn điểm từ 0-100
        score = Math.max(0, Math.min(100, score))

        return {
            score,
            details
        }
    }

    const generateRecipe = async () => {
        if (!dishName.trim()) {
            setError('Vui lòng nhập tên món ăn')
            return
        }

        setIsLoading(true)
        setError('')
        setRecipe(null)

        try {
            const prompt = `Bạn là một đầu bếp chuyên nghiệp. Hãy tạo công thức nấu món "${dishName}" với các thông tin sau:

Yêu cầu trả về JSON với cấu trúc sau:
{
    "name": "Tên món ăn",
    "description": "Mô tả ngắn gọn về món ăn",
    "ingredients": [
        "Danh sách nguyên liệu với số lượng cụ thể"
    ],
    "steps": [
        "Các bước nấu chi tiết. Sử dụng Markdown để định dạng. Ví dụ: **Bước 1: Sơ chế**: Rửa sạch các nguyên liệu..."
    ],
    "cookingTime": "Thời gian nấu (ví dụ: 30 phút)",
    "servings": "Số người ăn",
    "difficulty": "Độ khó (Dễ/Trung bình/Khó)",
    "tips": [
        "Các mẹo nấu ăn hữu ích. Có thể sử dụng **in đậm** hoặc *in nghiêng* để nhấn mạnh"
    ],
    "nutritionInfo": {
        "calories": "Số calo cho một phần ăn",
        "protein": "Lượng protein",
        "carbs": "Lượng carbs",
        "fat": "Lượng chất béo"
    }
}

Yêu cầu:
1. Công thức phải chi tiết và dễ làm theo
2. Liệt kê đầy đủ nguyên liệu với số lượng cụ thể
3. Các bước nấu phải rõ ràng và dễ hiểu
4. Thêm các mẹo nấu ăn hữu ích
5. Thông tin dinh dưỡng phải chính xác
6. Sử dụng ngôn ngữ tiếng Việt
7. Đảm bảo công thức khả thi và thực tế
8. Sử dụng Markdown để định dạng:
   - **in đậm** cho tiêu đề các bước
   - *in nghiêng* cho các lưu ý quan trọng
   - Có thể dùng > để tạo blockquote cho mẹo đặc biệt`

            const response = await aiService.processWithAI(prompt)
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/)
                if (!jsonMatch) {
                    throw new Error('Không tìm thấy công thức trong phản hồi')
                }
                const recipeData = JSON.parse(jsonMatch[0])
                
                // Tính điểm healthy
                const healthScore = calculateHealthScore(recipeData.nutritionInfo, recipeData.servings)
                setRecipe({ ...recipeData, healthScore })
            } catch (error) {
                console.error('Error parsing AI response:', error)
                throw new Error('Không thể phân tích công thức từ AI')
            }
        } catch (error) {
            console.error('Error generating recipe:', error)
            setError('Không thể tạo công thức. Vui lòng thử lại sau.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            generateRecipe()
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
                    <BeakerIcon className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">Tạo Công Thức Nấu Ăn</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên món ăn
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={dishName}
                                onChange={(e) => setDishName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập tên món ăn bạn muốn nấu"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                            <BeakerIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={generateRecipe}
                            disabled={!dishName.trim() || isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            ) : (
                                <BeakerIcon className="w-5 h-5" />
                            )}
                            {isLoading ? 'Đang tạo công thức...' : 'Tạo công thức'}
                        </button>
                    </div>

                    {recipe && (
                        <div className="space-y-6">
                            <div className="p-4 bg-gray-50 rounded-md">
                                <h3 className="text-xl font-bold mb-2">{recipe.name}</h3>
                                <p className="text-gray-600 mb-4">{recipe.description}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-5 h-5" />
                                        <span>Thời gian: {recipe.cookingTime}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UsersIcon className="w-5 h-5" />
                                        <span>Khẩu phần: {recipe.servings}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BeakerIcon className="w-5 h-5" />
                                        <span>Độ khó: {recipe.difficulty}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-bold mb-2">Nguyên liệu:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {recipe.ingredients.map((ingredient, index) => (
                                                <li key={index}>{ingredient}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-bold mb-2">Thông tin dinh dưỡng (mỗi phần):</h4>
                                            <ul className="space-y-1">
                                                <li>Calories: {recipe.nutritionInfo.calories}</li>
                                                <li>Protein: {recipe.nutritionInfo.protein}</li>
                                                <li>Carbs: {recipe.nutritionInfo.carbs}</li>
                                                <li>Chất béo: {recipe.nutritionInfo.fat}</li>
                                            </ul>
                                        </div>

                                        {recipe.healthScore && (
                                            <div>
                                                <h4 className="font-bold mb-2">Đánh giá dinh dưỡng:</h4>
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${getHealthScoreColor(recipe.healthScore.score)}`}>
                                                    Điểm healthy: {recipe.healthScore.score}/100
                                                </div>
                                                <ul className="space-y-1 text-sm">
                                                    {recipe.healthScore.details.map((detail, index) => (
                                                        <li key={index}>{detail}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold mb-2">Các bước thực hiện:</h4>
                                    <div className="space-y-4">
                                        {recipe.steps.map((step, index) => (
                                            <div key={index} className="prose max-w-none">
                                                <ReactMarkdown>{step}</ReactMarkdown>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold mb-2">Mẹo nấu ăn:</h4>
                                    <div className="space-y-2">
                                        {recipe.tips.map((tip, index) => (
                                            <div key={index} className="prose max-w-none">
                                                <ReactMarkdown>{tip}</ReactMarkdown>
                                            </div>
                                        ))}
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