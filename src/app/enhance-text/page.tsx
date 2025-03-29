'use client'

import TextEnhancement from '@/components/TextEnhancement'

export const metadata = {
    title: 'Hỗ Trợ Tăng Cường Văn Bản - AI Tool',
    description: 'Hỗ Trợ Tăng Cường Văn Bản',
}
export default function EnhanceTextPage() {
    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <TextEnhancement />
        </div>
    )
} 