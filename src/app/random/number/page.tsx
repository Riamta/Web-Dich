'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function RandomNumberPage() {
  const [minNumber, setMinNumber] = useState<number>(1)
  const [maxNumber, setMaxNumber] = useState<number>(100)
  const [randomNumber, setRandomNumber] = useState<number | null>(null)

  // Generate a random number within the specified range
  const generateRandomNumber = () => {
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
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá trị nhỏ nhất
                </label>
                <input
                  type="number"
                  value={minNumber}
                  onChange={(e) => setMinNumber(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá trị lớn nhất
                </label>
                <input
                  type="number"
                  value={maxNumber}
                  onChange={(e) => setMaxNumber(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>
            
            <button
              onClick={generateRandomNumber}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Tạo số ngẫu nhiên</span>
            </button>
          </div>

          {randomNumber !== null && (
            <div className="mt-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-1">Kết quả</p>
                <p className="text-3xl font-bold text-gray-900">{randomNumber}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 