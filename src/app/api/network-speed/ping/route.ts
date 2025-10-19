import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Sử dụng httpbin để test ping - đơn giản và ổn định hơn
    const response = await fetch('https://httpbin.org/status/200', {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const endTime = Date.now();
    const ping = endTime - startTime;
    
    return NextResponse.json({
      success: true,
      ping,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ping test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Không thể đo ping',
        ping: null,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 