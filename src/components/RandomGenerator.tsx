'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowPathIcon, 
  ListBulletIcon, 
  CalculatorIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

export default function RandomGenerator() {
  // States for number generation
  const [minNumber, setMinNumber] = useState<number>(1)
  const [maxNumber, setMaxNumber] = useState<number>(100)
  const [randomNumber, setRandomNumber] = useState<number | null>(null)
  
  // States for text selection
  const [textList, setTextList] = useState<string>('')
  const [textItems, setTextItems] = useState<string[]>([])
  const [randomText, setRandomText] = useState<string | null>(null)
  const [removeSelectedItem, setRemoveSelectedItem] = useState<boolean>(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  
  // Active tab: 'number' or 'text'
  const [activeTab, setActiveTab] = useState<'number' | 'text'>('number')

  // Update textItems whenever textList changes
  useEffect(() => {
    const items = textList
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)
    setTextItems(items)
  }, [textList])

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

  // Select a random item from the text list
  const generateRandomText = () => {
    if (textItems.length === 0) {
      setRandomText('Vui lòng nhập danh sách của bạn')
      return
    }
    
    const randomIndex = Math.floor(Math.random() * textItems.length)
    setRandomText(textItems[randomIndex])
    setSelectedIndex(randomIndex)
    
    // Remove the selected item if option is enabled
    if (removeSelectedItem) {
      removeItem(randomIndex)
    }
  }
  
  // Remove an item from the list
  const removeItem = (index: number) => {
    if (index < 0 || index >= textItems.length) return
    
    const updatedItems = [...textItems]
    updatedItems.splice(index, 1)
    
    // Convert back to string for textarea
    setTextList(updatedItems.join('\n'))
  }
  
  // Remove the currently selected item
  const removeCurrentItem = () => {
    if (selectedIndex >= 0) {
      removeItem(selectedIndex)
      setSelectedIndex(-1)
    }
  }

  return (
    <div className="container mx-auto px-4 max-w-3xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('number')}
            className={`flex-1 py-3 font-medium text-sm ${
              activeTab === 'number'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CalculatorIcon className="w-4 h-4" />
              <span>Số ngẫu nhiên</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 font-medium text-sm ${
              activeTab === 'text'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ListBulletIcon className="w-4 h-4" />
              <span>Văn bản ngẫu nhiên</span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'number' ? (
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
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh sách (mỗi dòng là một mục)
                  </label>
                  <textarea
                    value={textList}
                    onChange={(e) => setTextList(e.target.value)}
                    placeholder="Nhập danh sách của bạn ở đây, mỗi dòng một mục"
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {textItems.length > 0 ? (
                      <p>Có {textItems.length} mục trong danh sách</p>
                    ) : (
                      <p>Vui lòng nhập danh sách của bạn</p>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={removeSelectedItem}
                        onChange={(e) => setRemoveSelectedItem(e.target.checked)}
                        className="w-4 h-4 text-gray-900 rounded focus:ring-0"
                      />
                      <span className="ml-2 text-sm text-gray-600">Xóa sau khi chọn</span>
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={generateRandomText}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  disabled={textItems.length === 0}
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Chọn ngẫu nhiên</span>
                </button>
              </div>

              {randomText !== null && (
                <div className="mt-6">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Kết quả</p>
                        <p className="text-xl font-medium text-gray-900 break-words">{randomText}</p>
                      </div>
                      
                      {!removeSelectedItem && selectedIndex >= 0 && (
                        <button
                          onClick={removeCurrentItem}
                          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                          title="Xóa mục này khỏi danh sách"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 