import { Inter } from 'next/font/google'
import './globals.css'
import LayoutContent from '@/components/LayoutContent'
import { metadata, viewport } from './metadata'

const inter = Inter({ subsets: ['latin'] })

export { metadata, viewport }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <LayoutContent className={`${inter.className} antialiased`}>
        {children}
      </LayoutContent>
    </html>
  )
} 