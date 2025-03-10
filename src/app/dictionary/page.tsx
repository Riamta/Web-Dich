'use client'

import dynamic from 'next/dynamic'

const DictionaryManager = dynamic(
  () => import('@/components/DictionaryManager'),
  { ssr: false }
)

export default function DictionaryPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Từ điển thay thế</h1>
      <div className="max-w-2xl mx-auto">
        <DictionaryManager />
      </div>
    </main>
  )
} 