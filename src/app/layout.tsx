import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Menubar from '@/components/Menubar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Story Translation App',
  description: 'AI-powered story translation and summarization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Sidebar />
        <Menubar />
        <main className="pl-20 pt-14">
          {children}
        </main>
      </body>
    </html>
  )
} 