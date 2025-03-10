'use client'

import TextSummarization from '@/components/TextSummarization';

export default function SummarizePage() {
  return (
    <main className="container mx-auto px-4 py-8" suppressHydrationWarning>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TextSummarization />
      </div>
    </main>
  );
} 