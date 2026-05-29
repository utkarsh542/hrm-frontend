'use client';
import { useState, useRef, useEffect } from 'react';
import { User } from '@/types';
import { getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  Bell, Shield, UserCog, Crown, UserCircle,
  LogOut, Lock, Menu,
} from 'lucide-react';

interface HeaderProps {
  sidebarCollapsed: boolean;
  currentUser: User | null;
  onLogout: () => void;
  onToggleMobileSidebar?: () => void;
}

type Role = 'admin' | 'hr' | 'manager' | 'employee';

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; Icon: any }> = {
  admin:    { label: 'Administrator', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  Icon: Shield },
  hr:       { label: 'HR Manager',    color: '#6c63ff', bg: 'rgba(108,99,255,0.12)', Icon: UserCog },
  manager:  { label: 'Team Manager',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', Icon: Crown },
  employee: { label: 'Employee',      color: '#10b981', bg: 'rgba(16,185,129,0.12)', Icon: UserCircle },
};

interface NotifItem {
  id: number; title: string; message: string; type: string; is_read: boolean; created_at: string;
}

export default function Header({ 
  sidebarCollapsed, 
  currentUser, 
  onLogout,
  onToggleMobileSidebar 
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [changingPass, setChangingPass] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      alert("Please fill in all fields.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert("New passwords do not match.");
      return;
    }
    setChangingPass(true);
    try {
      const { api } = await import('@/lib/api');
      await api.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      alert("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setChangingPass(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      api.getUnreadNotificationCount(currentUser.id)
        .then(d => setUnreadCount(d.count || 0)).catch(() => {});
    }
  }, [currentUser?.id]);

  const loadNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await api.getNotifications(currentUser.id, 20);
      setNotifications(data);
    } catch (e) { console.error(e); }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      const d = await api.getUnreadNotificationCount(currentUser?.id as number);
      setUnreadCount(d.count || 0);
    } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    if (!currentUser?.id) return;
    try {
      await api.markAllNotificationsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) { console.error(e); }
  };

  const role = (currentUser?.role ?? 'employee') as Role;
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.employee;
  const RoleIcon = cfg.Icon;

  return (
    <>
      <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="header-left">
          {onToggleMobileSidebar && (
            <button 
              className="mobile-menu-btn" 
              onClick={onToggleMobileSidebar}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        <div className="header-right">
          {/* Role badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 20,
            background: cfg.bg, border: `1.5px solid ${cfg.color}44`,
            fontSize: 12, fontWeight: 700, color: cfg.color,
          }}>
            <RoleIcon size={14} strokeWidth={2} />
            <span>{cfg.label}</span>
          </div>

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button className="header-icon-btn" title="Notifications"
              onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) loadNotifications(); }}>
              <Bell size={18} strokeWidth={2} />
              {unreadCount > 0 && <span className="badge-dot"></span>}
            </button>
            {showNotifs && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', width: 340, maxHeight: 400,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'auto', zIndex: 200,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Notifications</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        style={{ background: 'none', border: 'none', color: '#6c63ff', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        Mark all as read
                      </button>
                    )}
                    {unreadCount > 0 && <span style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(108,99,255,0.15)', color: '#6c63ff', fontSize: 11, fontWeight: 700 }}>{unreadCount} new</span>}
                  </div>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>No notifications yet</div>
                ) : notifications.map(n => (
                  <div key={n.id} 
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: n.is_read ? 'default' : 'pointer',
                      background: n.is_read ? 'transparent' : 'rgba(108,99,255,0.05)', transition: 'background 0.2s' }}
                    onMouseEnter={e => !n.is_read && (e.currentTarget.style.background = 'rgba(108,99,255,0.08)')}
                    onMouseLeave={e => !n.is_read && (e.currentTarget.style.background = 'rgba(108,99,255,0.05)')}
                  >
                    <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: 13 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avatar + dropdown */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <div
              className="user-avatar"
              onClick={() => setShowMenu(!showMenu)}
              style={{ border: `2px solid ${cfg.color}`, cursor: 'pointer' }}
            >
              {currentUser ? getInitials(currentUser.full_name) : '?'}
            </div>

            {showMenu && currentUser && (
              <div style={{
                position: 'absolute', right: 0, top: '110%',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: 16, minWidth: 220,
                zIndex: 200, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: cfg.bg, border: `2px solid ${cfg.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, color: cfg.color,
                  }}>
                    {getInitials(currentUser.full_name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{currentUser.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{currentUser.email}</div>
                  </div>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`,
                  marginBottom: 14,
                }}>
                  <RoleIcon size={13} strokeWidth={2} /> {cfg.label}
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 12px' }} />
                <button
                  onClick={() => { setShowMenu(false); setShowPasswordModal(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '9px 10px', borderRadius: 8,
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    marginBottom: 8,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}
                >
                  <Lock size={15} strokeWidth={2} /> Change Password
                </button>
                <button
                  onClick={() => { setShowMenu(false); onLogout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '9px 10px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                >
                  <LogOut size={15} strokeWidth={2} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Current Password *</label>
                <input className="form-input" type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">New Password *</label>
                <input className="form-input" type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password *</label>
                <input className="form-input" type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)} disabled={changingPass}>Cancel</button>
              <button className="btn btn-primary" onClick={handleChangePassword} disabled={changingPass}>
                {changingPass ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
