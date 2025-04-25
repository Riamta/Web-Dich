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
export function generatePassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      password += charset[randomIndex]
  }
  return password
}

export function generateRandomUsername(length = 8): string {
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let username = ''
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      username += charset[randomIndex]
  }
  return username
}