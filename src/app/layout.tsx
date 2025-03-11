import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Menubar from '@/components/Menubar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Tool',
  description: 'AI Tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden bg-gray-100">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Menubar />
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
} 