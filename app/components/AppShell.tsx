'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Don't show app shell on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar - Desktop and Mobile */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar />
        {/* Close button for mobile */}
        <button 
          className="absolute top-4 right-[-40px] flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-md lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with Mobile Menu Toggle */}
        <div className="flex items-center border-b border-gray-200 bg-white lg:hidden px-4 h-16">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-3 font-bold text-gray-900">Radiamex</span>
        </div>
        
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
