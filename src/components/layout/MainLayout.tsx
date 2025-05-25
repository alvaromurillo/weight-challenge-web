'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Sidebar />
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="container mx-auto px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 