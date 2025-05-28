import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { QuickActions } from './QuickActions';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-6">
          <QuickActions />
          <main className="mt-6">
            {children}
          </main>
        </div>
        <footer className="py-4 px-6 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Hospital Management System
        </footer>
      </div>
    </div>
  );
};