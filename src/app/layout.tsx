'use client';
import { useState, useEffect } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AICopilot from '@/components/ai/AICopilot';
import LoginPage from '@/components/auth/LoginPage';
import { User } from '@/types';
import { api } from '@/lib/api';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from existing token
    const token = localStorage.getItem('hrms_token');
    if (!token) { setLoading(false); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check token not expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('hrms_token');
        setLoading(false);
        return;
      }
      // Fetch user list to restore full user object
      api.getDemoUsers().then((users: any) => {
        const matched = users.find((u: any) => u.email === payload.sub);
        if (matched) setCurrentUser(matched);
        else localStorage.removeItem('hrms_token');
      }).catch(() => {
        localStorage.removeItem('hrms_token');
      }).finally(() => setLoading(false));
    } catch {
      localStorage.removeItem('hrms_token');
      setLoading(false);
    }
  }, []);

  const handleLogin = (user: User, token: string) => {
    localStorage.setItem('hrms_token', token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('hrms_token');
    setCurrentUser(null);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>HRMS — HR Management System</title>
        <meta name="description" content="Enterprise HR Management System" />
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
        ) : !currentUser ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <>
            <div className="app-layout">
              <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                currentUser={currentUser}
              />
              <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Header
                  sidebarCollapsed={sidebarCollapsed}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
                <div className="page-container">
                  {children}
                </div>
              </div>
            </div>
            <AICopilot />
          </>
        )}
      </body>
    </html>
  );
}
