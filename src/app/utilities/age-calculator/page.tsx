import AgeCalculator from '@/components/AgeCalculator'

// Move metadata to a separate layout.tsx file
export default function AgeCalculatorPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Tính tuổi</h1>
                    <p className="text-gray-600">
                        Công cụ tính tuổi chính xác giúp bạn biết được tuổi thực của mình theo năm, tháng, ngày, giờ, phút và giây.
                        Bạn cũng sẽ biết được cung hoàng đạo và thế hệ của mình.
                    </p>
                </div>
                <AgeCalculator />
            </div>
        </div>
    )
}