'use client'

import Translator from '@/components/Translator'

export const metadata = {
    title: 'Hỗ Trợ Dịch Văn Bản - AI Tool',
    description: 'Hỗ Trợ Dịch Văn Bản',
}
export default function TranslatePage() {
  return (
    <div className="py-8">
      <Translator />
    </div>
  )
} 