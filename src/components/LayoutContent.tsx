'use client';

import { usePageView } from '@/hooks/usePageView';
import Sidebar from '@/components/Sidebar';
import Menubar from '@/components/Menubar';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Analytics } from "@vercel/analytics/react";

export default function LayoutContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  usePageView();

  return (
    <body className={className}>
      <ThemeProvider>
        <AuthProvider>
          <SidebarProvider>
            <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
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
          </SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
      <Analytics />
    </body>
  );
} 