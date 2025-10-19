import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test đơn giản - chỉ trả về thời gian hiện tại
    const startTime = Date.now();
    
    // Thử ping một endpoint đơn giản
    const response = await fetch('https://httpbin.org/status/200', {
      signal: AbortSignal.timeout(5000)
    });
    
    const endTime = Date.now();
    const ping = endTime - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'API test successful',
      ping,
      timestamp: new Date().toISOString(),
      serverTime: new Date().toLocaleString()
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Test failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 