import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLanguageName(code: string): string {
  switch (code) {
    case 'en': return 'tiếng Anh'
    case 'zh': return 'tiếng Trung'
    case 'ja': return 'tiếng Nhật'
    case 'ko': return 'tiếng Hàn'
    case 'vi': return 'tiếng Việt'
    case 'fr': return 'tiếng Pháp'
    case 'de': return 'tiếng Đức'
    case 'ru': return 'tiếng Nga'
    case 'auto': return 'Tự động nhận diện'
    default: return code
  }
} 