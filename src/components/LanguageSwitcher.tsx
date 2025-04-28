'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const handleValueChange = (value: string) => {
    setLanguage(value as 'en' | 'vi');
  };

  return (
    <div className="relative">
      <Select value={language} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[120px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-0 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out focus:ring-2 focus:ring-primary">
          <div className="flex items-center space-x-2">
            <GlobeAltIcon className="h-5 w-5" />
            <SelectValue placeholder={language === 'en' ? 'EN' : 'VI'} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('common.english')}</SelectItem>
          <SelectItem value="vi">{t('common.vietnamese')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}