import { useState, useEffect } from 'react';

export function useTabState<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Khởi tạo state
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      // Check if page was refreshed
      if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD) {
        return initialValue;
      }
      
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // Cập nhật localStorage khi state thay đổi
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      if (state === initialValue && window.performance?.navigation.type === window.performance.navigation.TYPE_RELOAD) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, state, initialValue]);

  return [state, setState];
} 