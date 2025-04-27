'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function RandomColorPage() {
  const [randomColor, setRandomColor] = useState<string | null>(null)
  const [colorHistory, setColorHistory] = useState<string[]>([])
  
  // Generate a random color
  const generateRandomColor = () => {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16)
    const hexColor = `#${randomHex.padStart(6, '0')}`
    setRandomColor(hexColor)
    
    // Add to history (keep last 5)
    setColorHistory(prev => {
      const updatedHistory = [hexColor, ...prev]
      return updatedHistory.slice(0, 5)
    })
  }
  
  // Copy color to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Tạo mã màu HEX ngẫu nhiên cho thiết kế, website hoặc ứng dụng của bạn. Mỗi lần nhấn nút sẽ tạo một mã màu mới hoàn toàn ngẫu nhiên.
            </p>
            
            <button
              onClick={generateRandomColor}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Tạo màu ngẫu nhiên</span>
            </button>
          </div>

          {randomColor && (
            <div className="mt-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-500 mb-3">Kết quả</p>
                <div className="flex flex-col items-center space-y-3">
                  <div 
                    className="w-full h-40 rounded-lg border border-gray-200" 
                    style={{ backgroundColor: randomColor }}
                  />
                  <div className="flex items-center justify-between w-full">
                    <p className="text-xl font-medium text-gray-900 uppercase">{randomColor}</p>
                    <button
                      onClick={() => copyToClipboard(randomColor)}
                      className="ml-2 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {colorHistory.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Lịch sử màu đã tạo</p>
              <div className="grid grid-cols-5 gap-2">
                {colorHistory.map((color, index) => (
                  <div key={index} className="group relative cursor-pointer" onClick={() => copyToClipboard(color)}>
                    <div 
                      className="w-full aspect-square rounded border border-gray-200" 
                      style={{ backgroundColor: color }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                      <p className="text-xs text-white font-medium">{color}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 