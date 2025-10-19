'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { NetworkSpeedService, NetworkSpeedResult } from '@/lib/network-speed-service';

export default function NetworkSpeed() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<NetworkSpeedResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Đo tốc độ mạng sử dụng service
  const runSpeedTest = async () => {
    setTesting(true);
    setError(null);
    setProgress(0);
    setResult(null);
    
    try {
      // 1. Đo ping
      setProgress(10);
      const pingData = await NetworkSpeedService.testPing();
      
      if (!pingData.success) {
        throw new Error(pingData.error || 'Lỗi đo ping');
      }
      
      const ping = pingData.ping;
      setProgress(30);

      // 2. Đo download
      setProgress(40);
      const downloadData = await NetworkSpeedService.testDownload();
      
      if (!downloadData.success) {
        throw new Error(downloadData.error || 'Lỗi đo download');
      }
      
      const downloadMbps = downloadData.downloadSpeed;
      setProgress(60);

      // 3. Đo upload
      setProgress(70);
      const uploadData = await NetworkSpeedService.testUpload();
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Lỗi đo upload');
      }
      
      const uploadMbps = uploadData.uploadSpeed;
      setProgress(90);

      // 4. Lấy thông tin IP và ISP
      setProgress(95);
      let ip = '', isp = '';
      try {
        const ipData = await NetworkSpeedService.getIpInfo();
        
        if (ipData.success) {
          ip = ipData.ip;
          isp = ipData.isp;
        }
      } catch (ipError) {
        console.warn('Không thể lấy thông tin IP:', ipError);
      }
      
      // 5. Lấy loại kết nối từ browser
      let connectionType = '';
      // @ts-ignore
      if ((navigator as any).connection && (navigator as any).connection.effectiveType) {
        // @ts-ignore
        connectionType = navigator.connection.effectiveType || '';
      }
      
      setProgress(100);
      setResult({
        download: downloadMbps,
        upload: uploadMbps,
        ping,
        ip,
        isp,
        connectionType,
        timestamp: new Date().toLocaleString(),
      });
    } catch (e: any) {
      setError(e.message || 'Không thể đo tốc độ mạng. Vui lòng thử lại.');
    } finally {
      setTesting(false);
      setProgress(0);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Kiểm tra tốc độ mạng</CardTitle>
        <CardDescription>
          Đo tốc độ download, upload, ping và thông tin mạng của bạn. Kết quả chỉ mang tính tham khảo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          <Button 
            onClick={runSpeedTest} 
            disabled={testing} 
            className="w-full max-w-xs h-12 text-lg font-medium"
            size="lg"
          >
            {testing ? 'Đang đo tốc độ...' : 'Bắt đầu đo tốc độ'}
          </Button>
          
          {testing && (
            <div className="w-full max-w-md">
              <Progress value={progress} className="w-full h-3" />
              <p className="text-center text-sm text-slate-600 mt-2">
                {progress <= 30 && 'Đang đo ping...'}
                {progress > 30 && progress <= 60 && 'Đang đo tốc độ download...'}
                {progress > 60 && progress <= 90 && 'Đang đo tốc độ upload...'}
                {progress > 90 && 'Đang lấy thông tin mạng...'}
              </p>
            </div>
          )}
          
          {error && (
            <div className="text-red-600 text-sm text-center p-4 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          {result && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-6 bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl border border-sky-200">
                <span className="text-3xl font-bold text-sky-700">{result.download}</span>
                <span className="text-sm text-sky-600 font-medium">Mbps Download</span>
              </div>
              <div className="flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <span className="text-3xl font-bold text-green-700">{result.upload}</span>
                <span className="text-sm text-green-600 font-medium">Mbps Upload</span>
              </div>
              <div className="flex flex-col items-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <span className="text-3xl font-bold text-orange-700">{result.ping}</span>
                <span className="text-sm text-orange-600 font-medium">Ping (ms)</span>
              </div>
              <div className="flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <span className="text-lg font-semibold text-purple-700">{result.connectionType || 'Không rõ'}</span>
                <span className="text-sm text-purple-600 font-medium">Loại kết nối</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {result && (
        <CardFooter className="flex flex-col items-start gap-2 text-sm text-slate-600 bg-slate-50 border-t">
          <div className="flex items-center gap-2">
            <span className="font-medium">IP:</span>
            <span className="font-mono text-slate-800">{result.ip || 'Không rõ'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">ISP:</span>
            <span className="text-slate-800">{result.isp || 'Không rõ'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Thời gian đo:</span>
            <span className="text-slate-800">{result.timestamp}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 