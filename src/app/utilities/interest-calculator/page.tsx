'use client';

import { InterestCalculator } from '@/components/InterestCalculator';

export default function InterestCalculatorPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold mb-2">Tính lãi suất tiết kiệm</h1>
                    <p className="text-gray-600">
                        Tính toán số tiền lãi bạn sẽ nhận được từ tiền gửi tiết kiệm với các kỳ hạn khác nhau
                    </p>
                </div>
                <InterestCalculator />
            </div>
        </div>
    );
} 