'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MdTranslate, MdSummarize, MdChat, MdAutoFixHigh, MdPerson, MdCode, MdSubtitles } from 'react-icons/md';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Chat với AI',
      path: 'https://chat.amri2k.com/',
      icon: <MdChat className="w-6 h-6" />,
      isExternal: true
    },
    {
      name: 'Dịch văn bản',
      path: '/',
      icon: <MdTranslate className="w-6 h-6" />,
      isExternal: false
    },
    {
      name: 'Dịch phụ đề',
      path: '/srt-translate',
      icon: <MdSubtitles className="w-6 h-6" />,
      isExternal: false
    },
    {
      name: 'Tóm tắt văn bản',
      path: '/summarize',
      icon: <MdSummarize className="w-6 h-6" />,
      isExternal: false
    }
  ];

  return (
    <div className="w-20 bg-white shadow-xl h-screen fixed left-0 top-0 flex flex-col py-6">
      <nav className="flex-1">
        <ul className="space-y-4 px-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              {item.isExternal ? (
                <a
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-3 rounded-full border-2 border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 relative group"
                >
                  {item.icon}
                  <span className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-full opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap transition-all duration-200 shadow-lg">
                    {item.name}
                  </span>
                </a>
              ) : (
                <Link
                  href={item.path}
                  className={`flex flex-col items-center p-3 rounded-full border-2 transition-all duration-200 relative group ${pathname === item.path
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                      : 'border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-500'
                    }`}
                >
                  {item.icon}
                  <span className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-full opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap transition-all duration-200 shadow-lg">
                    {item.name}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
} 