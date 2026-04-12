'use client';
import { useState, useEffect } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { User } from '@/types';
import { api } from '@/lib/api';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login as HR for demo
    const initAuth = async () => {
      try {
        const resp: any = await api.login('hr@techcorp.com', 'hr123');
        localStorage.setItem('hrms_token', resp.access_token);
        setCurrentUser(resp.user);
      } catch (e) {
        console.error('Auth failed:', e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>HRMS — HR Management System</title>
        <meta name="description" content="Enterprise HR Management System for complete HR workflow automation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        {loading ? (
          <div className="loading-page">
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Loading HRMS...</div>
            </div>
          </div>
        ) : (
          <div className="app-layout">
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
              <Header
                sidebarCollapsed={sidebarCollapsed}
                currentUser={currentUser}
                onUserChange={setCurrentUser}
              />
              <div className="page-container">
                {children}
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
