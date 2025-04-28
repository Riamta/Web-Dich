'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function RandomNumberPage() {
  const [minNumber, setMinNumber] = useState<number>(1)
  const [maxNumber, setMaxNumber] = useState<number>(100)
  const [randomNumber, setRandomNumber] = useState<number | null>(null)
  const [numberHistory, setNumberHistory] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  // Generate a random number within the specified range
  const generateRandomNumber = () => {
    setError(null)
    
    try {
      if (minNumber > maxNumber) {
        // Swap values if min is greater than max
        const temp = minNumber
        setMinNumber(maxNumber)
        setMaxNumber(temp)
      }
      
      const min = Math.ceil(minNumber)
      const max = Math.floor(maxNumber)
      const result = Math.floor(Math.random() * (max - min + 1)) + min
      setRandomNumber(result)
      
      // Add to history (max 10 entries)
      setNumberHistory(prev => {
        const updatedHistory = [result, ...prev]
        return updatedHistory.slice(0, 10)
      })
    } catch (error) {
      console.error('Error generating number:', error)
      setError('Có lỗi xảy ra khi tạo số. Vui lòng thử lại.')
    }
  }

  // Reset history
  const resetHistory = () => {
    setNumberHistory([])
    setRandomNumber(null)
    setError(null)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-800 mb-2">🎲 Number Generator</h1>
                <p className="text-gray-600">
                  Tạo số ngẫu nhiên trong khoảng bạn chọn.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Giá trị nhỏ nhất
                    </label>
                    <input
                      type="number"
                      value={minNumber}
                      onChange={(e) => setMinNumber(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Giá trị lớn nhất
                    </label>
                    <input
                      type="number"
                      value={maxNumber}
                      onChange={(e) => setMaxNumber(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                </div>
                
                <button
                  onClick={generateRandomNumber}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span className="font-medium">Tạo số ngẫu nhiên</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {(randomNumber !== null || error) && (
                <div className="mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 text-center transform transition-all hover:scale-[1.02]">
                    <p className="text-sm text-blue-600 mb-3">Số được chọn</p>
                    <p className="text-4xl font-bold text-blue-800">{randomNumber}</p>
                  </div>
                </div>
              )}
              
              {numberHistory.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-blue-800">📜 Lịch sử số đã tạo</p>
                    <button 
                      onClick={resetHistory}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl border-2 border-blue-200 overflow-hidden">
                    <div className="divide-y divide-blue-200">
                      {numberHistory.map((number, index) => (
                        <div 
                          key={index} 
                          className="p-4 text-sm hover:bg-blue-100 transition-colors"
                        >
                          <p className="font-medium text-blue-800">{number}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 