import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateWatermarkText(userEmail: string): string {
  const timestamp = new Date().toISOString().split('T')[0]
  return `${userEmail} - ${timestamp}`
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateReadingTime(pages: number, wordsPerPage: number = 250): number {
  const wordsPerMinute = 200
  const totalWords = pages * wordsPerPage
  return Math.ceil(totalWords / wordsPerMinute)
}

export function getProgressColor(percent: number): string {
  if (percent < 25) return 'text-red-500'
  if (percent < 50) return 'text-orange-500'
  if (percent < 75) return 'text-yellow-500'
  return 'text-green-500'
}

export function getProgressBarColor(percent: number): string {
  if (percent < 25) return 'bg-red-500'
  if (percent < 50) return 'bg-orange-500'
  if (percent < 75) return 'bg-yellow-500'
  return 'bg-green-500'
}
