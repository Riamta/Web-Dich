'use client'

import { useState, useEffect } from 'react'
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function RandomPasswordPage() {
  const [passwordLength, setPasswordLength] = useState<number>(12)
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true)
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true)
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true)
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true)
  const [randomPassword, setRandomPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | 'very-strong'>('medium')
  
  // Generate a random password
  const generateRandomPassword = () => {
    if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
      setRandomPassword('Vui lòng chọn ít nhất một loại ký tự')
      return
    }
    
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
    const numberChars = '0123456789'
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    let allowedChars = ''
    if (includeUppercase) allowedChars += uppercaseChars
    if (includeLowercase) allowedChars += lowercaseChars
    if (includeNumbers) allowedChars += numberChars
    if (includeSymbols) allowedChars += symbolChars
    
    let password = ''
    
    // Ensure at least one character from each selected type
    if (includeUppercase) {
      password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length))
    }
    if (includeLowercase) {
      password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length))
    }
    if (includeNumbers) {
      password += numberChars.charAt(Math.floor(Math.random() * numberChars.length))
    }
    if (includeSymbols) {
      password += symbolChars.charAt(Math.floor(Math.random() * symbolChars.length))
    }
    
    // Fill the rest of the password
    while (password.length < passwordLength) {
      const randomIndex = Math.floor(Math.random() * allowedChars.length)
      password += allowedChars[randomIndex]
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('')
    
    setRandomPassword(password)
    setCopied(false)
  }
  
  // Evaluate password strength
  useEffect(() => {
    if (!randomPassword || randomPassword === 'Vui lòng chọn ít nhất một loại ký tự') {
      setPasswordStrength('weak')
      return
    }
    
    let strength = 0
    
    // Length check
    if (randomPassword.length >= 8) strength += 1
    if (randomPassword.length >= 12) strength += 1
    if (randomPassword.length >= 16) strength += 1
    
    // Character variety check
    if (/[A-Z]/.test(randomPassword)) strength += 1
    if (/[a-z]/.test(randomPassword)) strength += 1
    if (/[0-9]/.test(randomPassword)) strength += 1
    if (/[^A-Za-z0-9]/.test(randomPassword)) strength += 1
    
    if (strength <= 4) {
      setPasswordStrength('weak')
    } else if (strength <= 6) {
      setPasswordStrength('medium')
    } else if (strength <= 7) {
      setPasswordStrength('strong')
    } else {
      setPasswordStrength('very-strong')
    }
  }, [randomPassword])
  
  // Copy password to clipboard
  const copyToClipboard = () => {
    if (randomPassword && randomPassword !== 'Vui lòng chọn ít nhất một loại ký tự') {
      navigator.clipboard.writeText(randomPassword)
      setCopied(true)
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
      case 'very-strong': return 'bg-green-600'
      default: return 'bg-gray-300'
    }
  }

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 'weak': return 'Yếu'
      case 'medium': return 'Trung bình'
      case 'strong': return 'Mạnh'
      case 'very-strong': return 'Rất mạnh'
      default: return ''
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Tạo mật khẩu mạnh với độ dài và loại ký tự tùy chỉnh. Mật khẩu được tạo ngẫu nhiên giúp bảo vệ tài khoản của bạn tốt hơn.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Độ dài: {passwordLength} ký tự
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="4"
                  max="32"
                  value={passwordLength}
                  onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="w-4 h-4 text-gray-900 rounded focus:ring-0"
                />
                <span className="ml-2 text-sm text-gray-600">Chữ hoa (A-Z)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="w-4 h-4 text-gray-900 rounded focus:ring-0"
                />
                <span className="ml-2 text-sm text-gray-600">Chữ thường (a-z)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="w-4 h-4 text-gray-900 rounded focus:ring-0"
                />
                <span className="ml-2 text-sm text-gray-600">Số (0-9)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="w-4 h-4 text-gray-900 rounded focus:ring-0"
                />
                <span className="ml-2 text-sm text-gray-600">Ký tự đặc biệt (!@#$%...)</span>
              </label>
            </div>
            
            <button
              onClick={generateRandomPassword}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Tạo mật khẩu ngẫu nhiên</span>
            </button>
          </div>

          {randomPassword && (
            <div className="mt-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-500 mb-3">Mật khẩu của bạn</p>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-medium text-gray-900 font-mono break-all">
                      {randomPassword}
                    </p>
                    <button
                      onClick={copyToClipboard}
                      className={`ml-2 px-3 py-1 text-xs font-medium ${
                        copied ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      } rounded transition-colors flex items-center gap-1`}
                      disabled={copied || randomPassword === 'Vui lòng chọn ít nhất một loại ký tự'}
                    >
                      {copied ? (
                        <>
                          <CheckCircleIcon className="w-3 h-3" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <span>Sao chép</span>
                      )}
                    </button>
                  </div>
                  
                  {randomPassword !== 'Vui lòng chọn ít nhất một loại ký tự' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Độ mạnh:</span>
                        <span className="font-medium">{getStrengthText()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${getStrengthColor()}`} style={{ 
                          width: passwordStrength === 'weak' ? '25%' : 
                                 passwordStrength === 'medium' ? '50%' : 
                                 passwordStrength === 'strong' ? '75%' : '100%' 
                        }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-xs text-gray-500 space-y-2">
            <p className="font-medium text-gray-700">Mẹo tạo mật khẩu mạnh:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sử dụng ít nhất 12 ký tự</li>
              <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
              <li>Tránh sử dụng thông tin cá nhân dễ đoán</li>
              <li>Sử dụng mật khẩu khác nhau cho các tài khoản khác nhau</li>
              <li>Cân nhắc sử dụng trình quản lý mật khẩu để lưu trữ an toàn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 