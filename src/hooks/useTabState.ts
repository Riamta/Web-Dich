import { useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

export function useTabState<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Khởi tạo state
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return initialValue;

      const parsedValue = JSON.parse(item);
      
      // Validate language values
      if (key === 'sourceLanguage' || key === 'targetLanguage') {
        const isValidLanguage = SUPPORTED_LANGUAGES.some(lang => lang.code === parsedValue);
        return isValidLanguage ? parsedValue : initialValue;
      }
      
      return parsedValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // Cập nhật localStorage khi state thay đổi
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Validate language values before saving
      if (key === 'sourceLanguage' || key === 'targetLanguage') {
        const isValidLanguage = SUPPORTED_LANGUAGES.some(lang => lang.code === state);
        if (!isValidLanguage) {
          localStorage.removeItem(key);
          return;
        }
      }
      
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, state]);

  return [state, setState];
} 