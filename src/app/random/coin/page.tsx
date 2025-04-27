'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function RandomCoinPage() {
  const [coinResult, setCoinResult] = useState<string | null>(null)
  const [isFlipping, setIsFlipping] = useState<boolean>(false)
  const [flipHistory, setFlipHistory] = useState<{result: string, timestamp: string}[]>([])
  const [headsCount, setHeadsCount] = useState<number>(0)
  const [tailsCount, setTailsCount] = useState<number>(0)
  
  // Flip a coin
  const flipCoin = () => {
    // Set flipping animation state
    setIsFlipping(true)
    
    // Delay the actual result to show animation
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'Mặt sấp' : 'Mặt ngửa'
      setCoinResult(result)
      setIsFlipping(false)
      
      // Update statistics
      if (result === 'Mặt ngửa') {
        setHeadsCount(prev => prev + 1)
      } else {
        setTailsCount(prev => prev + 1)
      }
      
      // Add to history (max 10 entries)
      const timestamp = new Date().toLocaleTimeString()
      setFlipHistory(prev => {
        const updatedHistory = [{result, timestamp}, ...prev]
        return updatedHistory.slice(0, 10)
      })
    }, 700)
  }
  
  // Reset statistics
  const resetStats = () => {
    setHeadsCount(0)
    setTailsCount(0)
    setFlipHistory([])
    setCoinResult(null)
  }
  
  // Calculate percentages
  const totalFlips = headsCount + tailsCount
  const headsPercentage = totalFlips > 0 ? Math.round((headsCount / totalFlips) * 100) : 0
  const tailsPercentage = totalFlips > 0 ? Math.round((tailsCount / totalFlips) * 100) : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Tung đồng xu ngẫu nhiên để giúp bạn đưa ra quyết định nhanh chóng. 
              Sử dụng để chọn "có/không", "đúng/sai" hoặc quyết định giữa hai lựa chọn.
            </p>
            
            <button
              onClick={flipCoin}
              disabled={isFlipping}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-70"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isFlipping ? 'animate-spin' : ''}`} />
              <span>{isFlipping ? 'Đang tung...' : 'Tung đồng xu'}</span>
            </button>
          </div>

          {(coinResult !== null || isFlipping) && (
            <div className="mt-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-3">Kết quả</p>
                <div className={`w-32 h-32 mx-auto bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center mb-4 ${isFlipping ? 'animate-[flip_0.7s_ease-in-out]' : ''}`}>
                  <span className="text-5xl">
                    {isFlipping ? '?' : coinResult === 'Mặt ngửa' ? '🪙' : '💫'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {isFlipping ? '...' : coinResult}
                </p>
              </div>
            </div>
          )}
          
          {totalFlips > 0 && (
            <>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Thống kê tung xu</p>
                  <button 
                    onClick={resetStats}
                    className="text-xs text-gray-500 hover:text-gray-800"
                  >
                    Đặt lại
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Mặt ngửa</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{headsCount}</span>
                        <span className="text-sm text-gray-500">({headsPercentage}%)</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Mặt sấp</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{tailsCount}</span>
                        <span className="text-sm text-gray-500">({tailsPercentage}%)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-900"
                      style={{ width: `${headsPercentage}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Tổng số lần tung: {totalFlips}
                  </p>
                </div>
              </div>
              
              {flipHistory.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Lịch sử tung xu</p>
                  <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {flipHistory.map((flip, index) => (
                        <div key={index} className="flex items-center justify-between p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {flip.result === 'Mặt ngửa' ? '🪙' : '💫'}
                            </span>
                            <span className={`font-medium ${
                              flip.result === 'Mặt ngửa' ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {flip.result}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{flip.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <style jsx global>{`
            @keyframes flip {
              0% { transform: rotateY(0); }
              100% { transform: rotateY(720deg); }
            }
          `}</style>
        </div>
      </div>
    </div>
  )
} 