import { Metadata } from 'next';
import NetworkSpeed from '@/components/NetworkSpeed';

export const metadata: Metadata = {
  title: 'Đo tốc độ mạng - Kiểm tra tốc độ download, upload, ping',
  description: 'Công cụ đo tốc độ mạng miễn phí. Kiểm tra tốc độ download, upload, ping và thông tin ISP của bạn.',
  keywords: 'đo tốc độ mạng, speed test, download speed, upload speed, ping test, kiểm tra mạng',
};

export default function NetworkSpeedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Đo tốc độ mạng</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Kiểm tra tốc độ mạng internet của bạn một cách nhanh chóng và chính xác. 
            Đo tốc độ download, upload, ping và xem thông tin ISP.
          </p>
        </div>
        <NetworkSpeed />
      </div>
    </div>
  );
} 