'use client'

import SRTTranslation from '@/components/SRTTranslation';
export const metadata = {
  title: 'Dịch file SRT - AI Tool',
  description: 'Dịch file SRT với nhiều ngôn ngữ khác nhau',
}
export default function SRTTranslatePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <SRTTranslation />
    </main>
  );
} 