'use client'

import { useState } from 'react'
import { ArrowPathIcon, StarIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'

export default function RandomUsernamePage() {
  const [prompt, setPrompt] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [usernames, setUsernames] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [count, setCount] = useState<number>(5)
  
  // Generate usernames using AI
  const generateUsernames = async () => {
    try {
      setLoading(true)
      setError('')
      
      const aiPrompt = prompt ? 
        `Tạo ${count} username độc đáo dựa trên yêu cầu của người dùng sau: "${prompt}". Chỉ trả về danh sách username, mỗi username một dòng, không có ký tự đặc biệt. Mỗi username tối đa 15 ký tự.` :
        `Tạo ${count} username ngẫu nhiên độc đáo, sáng tạo và thú vị. Chỉ trả về danh sách username, mỗi username một dòng, không có ký tự đặc biệt. Mỗi username phải dễ nhớ, có thể dùng cho mạng xã hội và game. Mỗi username tối đa 15 ký tự.`;
      
      const result = await aiService.processWithAI(aiPrompt);
      
      // Parse the result to get usernames
      const usernameList = result
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('-') && !line.startsWith('#'))
        .map(line => {
          // Remove any numbering or bullet points
          return line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '');
        });
      
      setUsernames(usernameList);
    } catch (error) {
      console.error('Error generating usernames:', error);
      setError('Có lỗi xảy ra khi tạo username. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }
  
  // Generate simple random username without AI
  const generateSimpleUsername = () => {
    setLoading(true)
    setError('')
    
    try {
      const adjectives = ['Super', 'Mega', 'Cool', 'Brave', 'Ninja', 'Epic', 'Magic', 'Pro', 'Royal', 'Alpha', 'Golden', 'Swift', 'Mystic', 'Cosmic', 'Pixel'];
      const nouns = ['Gamer', 'Legend', 'Warrior', 'Hunter', 'Dragon', 'Master', 'Hero', 'Wolf', 'Knight', 'Phoenix', 'Tiger', 'Eagle', 'Ghost', 'Falcon'];
      
      const randomUsernames = [];
      for (let i = 0; i < count; i++) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 999);
        const username = `${adj}${noun}${num}`;
        randomUsernames.push(username);
      }
      
      setUsernames(randomUsernames);
    } catch (error) {
      console.error('Error generating simple usernames:', error);
      setError('Có lỗi xảy ra khi tạo username. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }
  
  // Add username to favorites
  const toggleFavorite = (username: string) => {
    if (favorites.includes(username)) {
      setFavorites(favorites.filter(item => item !== username));
    } else {
      setFavorites([...favorites, username]);
    }
  }
  
  // Copy username to clipboard
  const copyToClipboard = (username: string) => {
    navigator.clipboard.writeText(username);
    setCopied(username);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Tạo tên người dùng độc đáo với sự trợ giúp của AI. Hãy nhập mô tả hoặc chủ đề bạn muốn để AI gợi ý các tên phù hợp. Nếu để trống, AI sẽ tạo tên người dùng ngẫu nhiên sáng tạo.
            </p>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Mô tả hoặc yêu cầu (tùy chọn)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: username liên quan đến game, tên có vẻ chuyên nghiệp cho công việc, tên dựa trên sở thích như âm nhạc, thể thao,..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Số lượng:</label>
                <select
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
              
              <button
                onClick={generateSimpleUsername}
                className="text-sm text-gray-600 hover:text-gray-900"
                disabled={loading}
              >
                Tạo nhanh (không dùng AI)
              </button>
            </div>
            
            <button
              onClick={generateUsernames}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-70"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Đang tạo...' : 'Tạo username với AI'}</span>
            </button>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
          </div>

          {usernames.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Username đề xuất</p>
              <div className="space-y-2">
                {usernames.map((username, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(username)}
                        className={`p-1.5 rounded-full ${favorites.includes(username) ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title={favorites.includes(username) ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                      >
                        <StarIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(username)}
                        className={`p-1.5 rounded-full ${copied === username ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Sao chép"
                      >
                        {copied === username ? (
                          <CheckCircleIcon className="w-4 h-4" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {favorites.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Username yêu thích</p>
              <div className="space-y-2">
                {favorites.map((username, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="flex items-center gap-2">
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(username)}
                        className="p-1.5 rounded-full text-gray-400 hover:text-gray-600"
                        title="Xóa khỏi yêu thích"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => copyToClipboard(username)}
                        className={`p-1.5 rounded-full ${copied === username ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Sao chép"
                      >
                        {copied === username ? (
                          <CheckCircleIcon className="w-4 h-4" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 text-xs text-gray-500 space-y-2">
            <p className="font-medium text-gray-700">Mẹo tạo username hay:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kết hợp tên và sở thích của bạn</li>
              <li>Sử dụng các từ đồng nghĩa hoặc từ điển thú vị</li>
              <li>Thêm số hoặc ký tự đặc biệt để tạo sự độc đáo</li>
              <li>Giữ ngắn gọn và dễ đọc</li>
              <li>Tránh thông tin cá nhân nhạy cảm</li>
              <li>Kiểm tra tính khả dụng trước khi sử dụng</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 