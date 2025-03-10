'use client'

import QuizGenerator from '@/components/QuizGenerator'

export default function QuizPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tạo câu hỏi trắc nghiệm</h1>
        <p className="mt-2 text-gray-600">
          Nhập yêu cầu của bạn và AI sẽ tạo ra các câu hỏi trắc nghiệm phù hợp kèm theo đáp án và giải thích chi tiết.
        </p>
      </div>
      <QuizGenerator />
    </div>
  )
} 