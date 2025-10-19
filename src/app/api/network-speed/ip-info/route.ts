import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Lấy IP từ request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';
    
    // Lấy thông tin chi tiết từ ipapi.co với timeout
    let ipData;
    try {
      const ipRes = await fetch('https://ipapi.co/json/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000) // 10 seconds timeout
      });
      
      if (!ipRes.ok) {
        throw new Error('Failed to fetch IP info');
      }
      
      ipData = await ipRes.json();
    } catch (ipError) {
      console.warn('Failed to fetch from ipapi.co:', ipError);
      // Fallback: chỉ trả về IP từ headers
      return NextResponse.json({
        success: true,
        ip: clientIp,
        isp: 'Unknown',
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        timezone: 'Unknown',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: true,
      ip: ipData.ip || clientIp,
      isp: ipData.org || ipData.org_name || ipData.isp || '',
      country: ipData.country_name || '',
      city: ipData.city || '',
      region: ipData.region || '',
      timezone: ipData.timezone || '',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('IP info error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Không thể lấy thông tin IP',
        ip: null,
        isp: null 
      },
      { status: 500 }
    );
  }
} 