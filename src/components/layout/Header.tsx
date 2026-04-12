'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  sidebarCollapsed: boolean;
  currentUser: User | null;
  onUserChange: (user: User) => void;
}

export default function Header({ sidebarCollapsed, currentUser, onUserChange }: HeaderProps) {
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    api.getDemoUsers().then((users: any) => setDemoUsers(users)).catch(() => {});
  }, []);

  const handleRoleSwitch = async (userId: number) => {
    try {
      const resp: any = await api.switchRole(userId);
      localStorage.setItem('hrms_token', resp.access_token);
      onUserChange(resp.user);
      setShowUserMenu(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <div className="header-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search employees, jobs, candidates..." />
        </div>
      </div>

      <div className="header-right">
        {/* Role Switcher */}
        <div className="role-switcher">
          {demoUsers.map(u => (
            <button
              key={u.id}
              className={`role-btn ${currentUser?.id === u.id ? 'active' : ''}`}
              onClick={() => handleRoleSwitch(u.id)}
              title={u.full_name}
            >
              {u.role.toUpperCase()}
            </button>
          ))}
        </div>

        <button className="header-icon-btn" title="Notifications">
          🔔
          <span className="badge-dot"></span>
        </button>

        <div style={{ position: 'relative' }}>
          <div className="user-avatar" onClick={() => setShowUserMenu(!showUserMenu)}>
            {currentUser ? getInitials(currentUser.full_name) : '?'}
          </div>
          {showUserMenu && currentUser && (
            <div style={{
              position: 'absolute', right: 0, top: '110%', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              padding: '16px', minWidth: '220px', zIndex: 200, boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{currentUser.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>{currentUser.email}</div>
              <div className="badge badge-primary" style={{ marginBottom: 12 }}>{currentUser.role}</div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Demo Mode — Switch roles above</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
