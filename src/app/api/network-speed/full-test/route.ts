import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const results: any = {};
    
    // 1. Đo ping
    try {
      const pingStart = Date.now();
      const pingRes = await fetch('https://www.google.com/favicon.ico', {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (pingRes.ok) {
        const pingEnd = Date.now();
        results.ping = pingEnd - pingStart;
      }
    } catch (error) {
      console.warn('Ping test failed:', error);
    }
    
    // 2. Đo download
    try {
      const downloadStart = Date.now();
      const downloadSize = 2 * 1024 * 1024; // 2MB
      const downloadUrl = `https://speed.hetzner.de/2MB.bin?cachebust=${Date.now()}`;
      
      const downloadRes = await fetch(downloadUrl, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (downloadRes.ok) {
        await downloadRes.blob();
        const downloadEnd = Date.now();
        const downloadTime = (downloadEnd - downloadStart) / 1000;
        results.downloadSpeed = +(downloadSize * 8 / downloadTime / 1e6).toFixed(2);
      }
    } catch (error) {
      console.warn('Download test failed:', error);
    }
    
    // 3. Đo upload
    try {
      const uploadStart = Date.now();
      const uploadSize = 1 * 1024 * 1024; // 1MB
      const uploadData = new Uint8Array(uploadSize);
      
      const uploadRes = await fetch('https://httpbin.org/post', {
        method: 'POST',
        body: uploadData,
        headers: { 
          'Content-Type': 'application/octet-stream',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
      });
      
      if (uploadRes.ok) {
        const uploadEnd = Date.now();
        const uploadTime = (uploadEnd - uploadStart) / 1000;
        results.uploadSpeed = +(uploadSize * 8 / uploadTime / 1e6).toFixed(2);
      }
    } catch (error) {
      console.warn('Upload test failed:', error);
    }
    
    // 4. Lấy thông tin IP
    try {
      const ipRes = await fetch('https://ipapi.co/json/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        results.ip = ipData.ip;
        results.isp = ipData.org || ipData.org_name || ipData.isp || '';
        results.country = ipData.country_name || '';
        results.city = ipData.city || '';
      }
    } catch (error) {
      console.warn('IP info test failed:', error);
    }
    
    results.timestamp = new Date().toISOString();
    results.success = true;
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Full network test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Không thể hoàn thành kiểm tra mạng',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 