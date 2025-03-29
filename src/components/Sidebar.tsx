'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MdTranslate, MdSubtitles, MdQuiz, MdSchool, MdChat, MdShortText, MdEdit, MdSpellcheck, MdAutoFixHigh, MdGamepad, MdImage, MdFavorite, MdOutlineMenuBook } from 'react-icons/md';
import Image from 'next/image';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();

  const menuItems = [
    {
      name: 'Dịch văn bản',
      path: '/',
      icon: <MdTranslate className="w-5 h-5" />,
      isExternal: false
    },
    {
      name: 'Dịch hội thoại',
      path: '/conversation',
      icon: <MdChat className="w-5 h-5" />,
      isExternal: false
    },
    {
      name: 'Hỗ trợ tán gái',
      path: '/flirting',
      icon: <MdFavorite className="w-5 h-5" />,
      isExternal: false
    },
    {
      name: 'Tóm tắt văn bản',
      path: '/summarize',
      icon: <MdShortText className="w-5 h-5" />,
      isExternal: false
    },
    {
      name: 'Cải thiện văn bản',
      path: '/enhance-text',
      icon: <MdAutoFixHigh className="w-5 h-5" />,
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
      name: 'Từ điển',
      path: '/dictionary',
      icon: <MdOutlineMenuBook className="w-5 h-5" />,
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
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar placeholder to maintain layout */}
      <div className={`${isOpen ? 'w-[280px]' : 'w-0'} shrink-0 transition-all duration-300 md:w-[240px]`} />

      {/* Fixed sidebar */}
      <div className={`fixed left-0 top-0 h-[100dvh] w-[280px] max-w-[90vw] bg-card border-r border-[hsl(var(--border))] flex flex-col z-50 
        transition-all duration-300 ease-in-out shadow-lg
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:shadow-none md:w-[240px] md:translate-x-0 md:h-screen`}>
        {/* Logo section */}
        <div className="h-[70px] md:h-16 flex items-center px-6 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/60 flex items-center justify-center text-primary-foreground">
              <MdAutoFixHigh className="w-[22px] h-[22px] md:w-5 md:h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">AI Tool</span>
          </div>
        </div>

        {/* Menu section */}
        <div className="flex-1 py-6 px-4 md:px-3 space-y-2 md:space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                target={item.target}
                onClick={() => {
                  // Close sidebar on mobile after clicking a link
                  if (window.innerWidth < 768) {
                    setIsOpen(false);
                  }
                }}
                className={`group flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl transition-colors duration-200
                  ${isActive
                    ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--accent))] active:scale-[0.98] border border-transparent'
                  } outline-none focus:outline-none focus:ring-0 focus-visible:outline-none [-webkit-tap-highlight-color:transparent] select-none`}
              >
                <div className={`p-2 md:p-1.5 rounded-lg transition-colors duration-200 
                  ${isActive
                    ? 'bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]'
                    : 'bg-[hsl(var(--secondary))] group-hover:bg-[hsl(var(--secondary))]/80 group-hover:text-foreground'
                  }`}>
                  {item.icon}
                </div>
                <span className="text-[15px] md:text-sm font-medium">{item.name}</span>
                {item.isExternal && (
                  <svg
                    className="w-4 h-4 md:w-3.5 md:h-3.5 ml-auto opacity-60 group-hover:opacity-100 transition-opacity"
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
        <div className="h-14 md:h-12 flex items-center justify-between px-6 border-t border-[hsl(var(--border))] text-sm md:text-xs text-muted-foreground">
          <span className="font-medium">v2.8.0</span>
          <span className="opacity-60">© 2024 AI Tool By Amri</span>
        </div>
      </div>
    </>
  );
}