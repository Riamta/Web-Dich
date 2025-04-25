import type { Metadata } from 'next'
import RecipeGenerator from '@/components/RecipeGenerator'

export const metadata: Metadata = {
  title: 'Tạo Công Thức Nấu Ăn | Công Cụ Nấu Ăn',
  description: 'Tạo công thức nấu ăn chi tiết với AI. Nhập tên món ăn và nhận công thức nấu ăn đầy đủ với nguyên liệu, các bước thực hiện và mẹo nấu ăn.',
  keywords: 'công thức nấu ăn, món ăn, hướng dẫn nấu ăn, AI nấu ăn, công thức món ăn, nấu ăn, recipe generator, cooking recipe',
  openGraph: {
    title: 'Tạo Công Thức Nấu Ăn | Công Cụ Nấu Ăn',
    description: 'Tạo công thức nấu ăn chi tiết với AI. Nhập tên món ăn và nhận công thức nấu ăn đầy đủ với nguyên liệu, các bước thực hiện và mẹo nấu ăn.',
    type: 'website',
  }
}

export default function RecipeGeneratorPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Tạo Công Thức Nấu Ăn</h1>
                    <p className="text-gray-600">
                        Nhập tên món ăn bạn muốn nấu và nhận công thức chi tiết với đầy đủ nguyên liệu, 
                        các bước thực hiện, thông tin dinh dưỡng và mẹo nấu ăn hữu ích.
                    </p>
                </div>
                <RecipeGenerator />
            </div>
        </div>
    )
} 