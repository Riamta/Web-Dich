'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowPathIcon, 
  TrashIcon, 
  ArrowsUpDownIcon, 
  ArrowUpIcon, 
  ArrowDownIcon 
} from '@heroicons/react/24/outline'

export default function RandomTextPage() {
  const [textList, setTextList] = useState<string>('')
  const [textItems, setTextItems] = useState<string[]>([])
  const [randomText, setRandomText] = useState<string | null>(null)
  const [removeSelectedItem, setRemoveSelectedItem] = useState<boolean>(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  // Update textItems whenever textList changes
  useEffect(() => {
    const items = textList
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)
    setTextItems(items)
  }, [textList])

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
  
  // Shuffle the items in the list
  const shuffleItems = () => {
    if (textItems.length <= 1) return
    
    const shuffled = [...textItems]
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    setTextList(shuffled.join('\n'))
  }
  
  // Sort items alphabetically (A->Z)
  const sortItemsAscending = () => {
    if (textItems.length <= 1) return
    
    const sorted = [...textItems].sort((a, b) => a.localeCompare(b, 'vi'))
    setTextList(sorted.join('\n'))
  }
  
  // Sort items in reverse alphabetical order (Z->A)
  const sortItemsDescending = () => {
    if (textItems.length <= 1) return
    
    const sorted = [...textItems].sort((a, b) => b.localeCompare(a, 'vi'))
    setTextList(sorted.join('\n'))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Danh sách (mỗi dòng là một mục)
                </label>
                
                <div className="flex space-x-2">
                  <button
                    onClick={shuffleItems}
                    disabled={textItems.length <= 1}
                    className="p-1.5 rounded bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
                    title="Xáo trộn danh sách"
                  >
                    <ArrowsUpDownIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={sortItemsAscending}
                    disabled={textItems.length <= 1}
                    className="p-1.5 rounded bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
                    title="Sắp xếp A-Z"
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={sortItemsDescending}
                    disabled={textItems.length <= 1}
                    className="p-1.5 rounded bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
                    title="Sắp xếp Z-A"
                  >
                    <ArrowDownIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
      </div>
    </div>
  )
} 