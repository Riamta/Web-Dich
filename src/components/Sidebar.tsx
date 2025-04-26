'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BeakerIcon,
  LanguageIcon,
  FilmIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PencilIcon,
  SparklesIcon,
  PuzzlePieceIcon,
  PhotoIcon,
  HeartIcon,
  BookOpenIcon,
  Square3Stack3DIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EnvelopeIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSidebar } from '@/contexts/SidebarContext';
import { useState } from 'react';

interface MenuItem {
  name: string;
  path: string;
  icon: JSX.Element;
  isExternal?: boolean;
  target?: string;
}

interface MenuGroup {
  name: string;
  icon: JSX.Element;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    name: 'Công cụ AI',
    icon: <SparklesIcon className="w-5 h-5" />,
    items: [
      {
        name: 'Dịch văn bản',
        path: '/translate',
        icon: <LanguageIcon className="w-5 h-5" />
      },
      {
        name: 'Dịch hội thoại',
        path: '/conversation-translate',
        icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />
      },
      {
        name: 'Dịch phụ đề',
        path: '/srt-translate',
        icon: <FilmIcon className="w-5 h-5" />
      },
      {
        name: 'Tóm tắt văn bản',
        path: '/summarize',
        icon: <DocumentTextIcon className="w-5 h-5" />
      },
      {
        name: 'Cải thiện văn bản',
        path: '/enhance-text',
        icon: <SparklesIcon className="w-5 h-5" />
      },
      {
        name: 'Hỗ trợ tán gái',
        path: '/flirting',
        icon: <HeartIcon className="w-5 h-5" />
      },
      {
        name: 'Tạo câu hỏi',
        path: '/quiz',
        icon: <QuestionMarkCircleIcon className="w-5 h-5" />
      },
      {
        name: 'Giải bài tập',
        path: '/aisolver',
        icon: <PuzzlePieceIcon className="w-5 h-5" />
      },
      {
        name: 'Học từ vựng',
        path: '/vocabulary',
        icon: <AcademicCapIcon className="w-5 h-5" />
      },
      {
        name: 'Từ điển',
        path: '/dictionary',
        icon: <BookOpenIcon className="w-5 h-5" />
      },
      {
        name: 'Tạo công thức nấu ăn',
        path: '/recipe-generator',
        icon: <BeakerIcon className="w-5 h-5" />
      }
    ]
  },
  {
    name: 'Tiện ích',
    icon: <Square3Stack3DIcon className="w-5 h-5" />,
    items: [
      {
        name: 'Chuyển đổi tiền tệ',
        path: '/currency',
        icon: <CurrencyDollarIcon className="w-5 h-5" />
      },
      {
        name: 'Quản lý chi tiêu',
        path: '/money-love',
        icon: <CreditCardIcon className="w-5 h-5" />
      },
      {
        name: 'Tạo tên người dùng',
        path: '/username-generator',
        icon: <PencilIcon className="w-5 h-5" />
      },
      {
        name: 'Email tạm thời',
        path: '/temp-mail',
        icon: <EnvelopeIcon className="w-5 h-5" />
      },
      {
        name: 'Chat với AI',
        path: 'https://chat.amri2k.com',
        icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
        isExternal: true,
        target: '_blank'
      }
    ]
  }
];

function MobileSidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    'Công cụ AI': true,
    'Tiện ích': true
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed inset-y-0 left-0 w-[90vw] max-w-[320px] bg-background border-r border-[hsl(var(--border))]/10 flex flex-col z-50 md:hidden">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[hsl(var(--border))]/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/60 flex items-center justify-center text-primary-foreground">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <span className="font-semibold text-lg">AI Tool</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 py-3 px-3 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Menu
          </div>
          {menuGroups.map((group, groupIndex) => (
            <div key={group.name} className={`${groupIndex > 0 ? 'mt-4' : 'mt-1'}`}>
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="p-1 rounded-lg bg-accent/50">
                  {group.icon}
                </div>
                <span className="flex-1 text-left font-medium text-sm">
                  {group.name}
                </span>
                <ChevronDownIcon 
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-200
                    ${expandedGroups[group.name] ? 'rotate-180' : ''}`} 
                />
              </button>
              <div className={`mt-1 space-y-0.5 overflow-hidden transition-all duration-200 ease-in-out
                ${expandedGroups[group.name] ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {group.items.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      target={item.target}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ml-4
                        ${isActive
                          ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-sm active:scale-[0.98]'
                        }`}
                    >
                      <div className={`p-1 rounded-lg transition-colors duration-200 
                        ${isActive
                          ? 'bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]'
                          : 'bg-accent/50 group-hover:bg-accent/80 group-hover:text-foreground'
                        }`}>
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.isExternal && (
                        <svg
                          className="w-3.5 h-3.5 ml-auto opacity-60 group-hover:opacity-100 transition-opacity"
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
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="h-14 flex items-center justify-between px-4 border-t border-[hsl(var(--border))]/10 text-sm text-muted-foreground">
          <span className="font-medium">v2.8.0</span>
          <span className="opacity-60">© 2024 AI Tool By Amri</span>
        </div>
      </div>
    </>
  );
}

function DesktopSidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    'Công cụ AI': true,
    'Tiện ích': true
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return (
    <>
      {/* Sidebar placeholder */}
      <div className={`hidden md:block ${isOpen ? 'w-[240px]' : 'w-[70px]'} shrink-0 transition-all duration-300`} />

      {/* Fixed sidebar */}
      <div className={`hidden md:flex fixed left-0 top-0 h-screen bg-background border-r border-[hsl(var(--border))]/10 flex-col z-50 
        transition-all duration-300 ease-in-out ${isOpen ? 'w-[240px]' : 'w-[70px]'}`}>
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-[hsl(var(--border))]/10 relative">
          <Link
            href="/"
            className="flex items-center gap-3 ml-3 hover:opacity-80 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded-lg"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/60 flex items-center justify-center text-primary-foreground">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <span className={`font-semibold text-lg tracking-tight text-foreground transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              AI Tool
            </span>
          </Link>
          
          {/* Collapse button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-[hsl(var(--border))]/10 flex items-center justify-center hover:bg-accent/50 transition-colors"
          >
            <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 py-3 px-3 overflow-y-auto">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.name} className={`${groupIndex > 0 ? 'mt-4' : 'mt-1'}`}>
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-accent/50 transition-colors ${!isOpen && 'justify-center'}`}
              >
                <div className="p-1 rounded-lg bg-accent/50">
                  {group.icon}
                </div>
                {isOpen && (
                  <>
                    <span className="flex-1 text-left font-medium text-sm">
                      {group.name}
                    </span>
                    <ChevronDownIcon 
                      className={`w-5 h-5 text-muted-foreground transition-transform duration-200
                        ${expandedGroups[group.name] ? 'rotate-180' : ''}`} 
                    />
                  </>
                )}
              </button>
              {isOpen && (
                <div className={`mt-1 space-y-0.5 overflow-hidden transition-all duration-200 ease-in-out
                  ${expandedGroups[group.name] ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {group.items.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        target={item.target}
                        className={`group flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ml-4
                          ${isActive
                            ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-sm active:scale-[0.98]'
                          }`}
                      >
                        <div className={`p-1 rounded-lg transition-colors duration-200 
                          ${isActive
                            ? 'bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]'
                            : 'bg-accent/50 group-hover:bg-accent/80 group-hover:text-foreground'
                          }`}>
                          {item.icon}
                        </div>
                        <span className="text-sm font-medium">{item.name}</span>
                        {item.isExternal && (
                          <svg
                            className="w-3.5 h-3.5 ml-auto opacity-60 group-hover:opacity-100 transition-opacity"
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
              )}
              {!isOpen && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        target={item.target}
                        title={item.name}
                        className={`group flex items-center justify-center p-2 rounded-lg transition-all duration-200
                          ${isActive
                            ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-sm active:scale-[0.98]'
                          }`}
                      >
                        <div className={`p-1 rounded-lg transition-colors duration-200 
                          ${isActive
                            ? 'bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]'
                            : 'bg-accent/50 group-hover:bg-accent/80 group-hover:text-foreground'
                          }`}>
                          {item.icon}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`h-12 flex items-center px-4 border-t border-[hsl(var(--border))]/10 text-xs text-muted-foreground ${isOpen ? 'justify-between' : 'justify-center'}`}>
          <span className="font-medium">v2.8.0</span>
          {isOpen && <span className="opacity-60">© 2024 AI Tool By Amri</span>}
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  return (
    <>
      <MobileSidebar />
      <DesktopSidebar />
    </>
  );
}