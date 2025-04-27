'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useRef, useEffect } from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion'; // For smooth animations

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const changeLanguage = (lang: 'en' | 'vi') => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={t('header.changeLanguage')}
        aria-expanded={isOpen}
      >
        <GlobeAltIcon className="h-5 w-5" />
        <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'VI'}</span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 z-50 overflow-hidden"
          >
            <ul className="py-1">
              {[
                { code: 'en', label: t('common.english') },
                { code: 'vi', label: t('common.vietnamese') },
              ].map(({ code, label }) => (
                <li key={code}>
                  <button
                    onClick={() => changeLanguage(code as 'en' | 'vi')}
                    className={`flex w-full px-4 py-2 text-sm text-left transition-colors duration-150 ${
                      language === code
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    aria-current={language === code ? 'true' : undefined}
                  >
                    <span className="flex-1">{label}</span>
                    {language === code && (
                      <svg
                        className="w-4 h-4 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}