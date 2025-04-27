'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowsRightLeftIcon, CalculatorIcon, ListBulletIcon } from '@heroicons/react/24/outline'

export default function RandomToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch('/api/page-views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: pathname,
          }),
        })
      } catch (error) {
        console.error('Error tracking page view:', error)
      }
    }

    trackPageView()
  }, [pathname])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <ArrowsRightLeftIcon className="w-8 h-8 text-gray-700" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Công cụ ngẫu nhiên</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Tạo số ngẫu nhiên trong một khoảng hoặc chọn ngẫu nhiên từ danh sách của bạn
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex border-b border-gray-100">
          <Link
            href="/random-tools"
            className={`flex-1 py-3 font-medium text-sm text-center ${
              pathname === '/random-tools'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowsRightLeftIcon className="w-4 h-4" />
              <span>Tổng quan</span>
            </div>
          </Link>
          <Link
            href="/random-tools/number"
            className={`flex-1 py-3 font-medium text-sm text-center ${
              pathname === '/random-tools/number'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CalculatorIcon className="w-4 h-4" />
              <span>Số ngẫu nhiên</span>
            </div>
          </Link>
          <Link
            href="/random-tools/text"
            className={`flex-1 py-3 font-medium text-sm text-center ${
              pathname === '/random-tools/text'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ListBulletIcon className="w-4 h-4" />
              <span>Văn bản ngẫu nhiên</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto">
        {children}
      </div>
      
      {/* Additional information */}
      <div className="mt-16 border-t border-gray-100 pt-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Về công cụ ngẫu nhiên</h2>
          <div className="space-y-4 text-gray-600 text-sm">
            <p>
              Công cụ ngẫu nhiên giúp bạn tạo ra các giá trị ngẫu nhiên một cách nhanh chóng và dễ dàng. 
              Bạn có thể sử dụng nó để:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Tạo các số ngẫu nhiên trong một khoảng bạn chọn</li>
              <li>Chọn ngẫu nhiên một mục từ danh sách của bạn</li>
              <li>Tổ chức bốc thăm trúng thưởng</li>
              <li>Quyết định lựa chọn khi bạn không thể tự quyết định</li>
              <li>Và nhiều ứng dụng khác trong cuộc sống hàng ngày</li>
            </ul>
            <p>
              Tất cả các quá trình tạo ngẫu nhiên đều được thực hiện trên trình duyệt của bạn, 
              đảm bảo sự riêng tư và bảo mật thông tin.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 