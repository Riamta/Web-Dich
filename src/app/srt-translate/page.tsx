'use client'

import SRTTranslation from '@/components/SRTTranslation';

export const metadata = {
    title: 'Hỗ Trợ Dịch SRT - AI Tool',
    description: 'Hỗ Trợ Dịch SRT',
}
export default function SRTTranslatePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <SRTTranslation />
    </main>
  );
} 