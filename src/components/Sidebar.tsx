'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MdTranslate, MdSubtitles, MdQuiz, MdSchool, MdChat, MdShortText, MdEdit } from 'react-icons/md';
import Image from 'next/image';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen } = useSidebar();

  const menuItems = [
    {
      name: 'Dịch văn bản',
      path: '/',
      icon: <MdTranslate className="w-5 h-5" />,
      isExternal: false
    },
    {
      name: 'Tóm tắt văn bản',
      path: '/summarize',
      icon: <MdShortText className="w-5 h-5" />,
      isExternal: false
    },
    {
      name: 'Dịch phụ đề',
      path: '/srt-translate',
      icon: <MdSubtitles className="w-5 h-5" />,
      isExternal: false
    },
    {
      name: 'Tạo câu hỏi',
      path: '/quiz',
      icon: <MdQuiz className="w-5 h-5" />,
      isExternal: false
    },
    {
      name: 'Học từ vựng',
      path: '/vocabulary',
      icon: <MdSchool className="w-5 h-5" />,
      isExternal: false
    },
    {
      name: 'Chat với AI',
      path: 'https://chat.amri2k.com',
      icon: <MdChat className="w-5 h-5" />,
      isExternal: true,
      target: '_blank'
    }
  ];

  return (
    <>
      {/* Sidebar placeholder to maintain layout */}
      <div className={`${isOpen ? 'w-[240px]' : 'w-0'} shrink-0 transition-all duration-300 md:w-[240px]`} />
      
      {/* Fixed sidebar */}
      <div className={`fixed left-0 top-0 h-screen bg-[#1E1F25] text-white flex flex-col z-30 transition-all duration-300 ${
        isOpen ? 'w-[240px]' : 'w-0 -translate-x-full'
      } md:w-[240px] md:translate-x-0`}>
        {/* Logo section */}
        <div className="h-14 flex items-center px-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            {/* <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="rounded"
            /> */}
            <span className="font-medium text-lg">AI Tool</span>
          </div>
        </div>

        {/* Menu section */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                target={item.target}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.name}</span>
                {item.isExternal && (
                  <svg
                    className="w-3 h-3 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                )}
              </Link>
            );
          })}
        </div>

        {/* Version info */}
        <div className="h-10 flex items-center justify-between px-4 border-t border-gray-700 text-xs text-gray-500">
          <span>v2.8.0</span>
          <span>© 2024 AI Tool By Amri</span>
        </div>
      </div>
    </>
  );
}