'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Shield, UserCog, Crown, UserCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';

const DEMO_CREDS = [
  { role: 'Admin',    email: 'admin@techcorp.com',    password: 'admin123',    icon: Shield, color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  { role: 'HR',       email: 'hr@techcorp.com',       password: 'hr123',       icon: UserCog, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  { role: 'Manager',  email: 'manager@techcorp.com',  password: 'manager123',  icon: Crown, color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  { role: 'Employee', email: 'employee@techcorp.com', password: 'employee123', icon: UserCircle, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
];

interface Props {
  onLogin: (user: User, token: string) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const doLogin = async (e?: string, p?: string) => {
    const em = e ?? email;
    const pw = p ?? password;
    if (!em || !pw) { setError('Please enter email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const resp: any = await api.login(em, pw);
      localStorage.setItem('hrms_token', resp.access_token);
      onLogin(resp.user, resp.access_token);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-primary)', padding: 20,
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 700, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #2563EB, #6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#fff',
            boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
          }}>H</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Welcome to HRMS</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Sign in with your credentials</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-lg)',
        }}>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
              placeholder="you@techcorp.com"
              style={{
                width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text-primary)', fontSize: 14,
                outline: 'none', fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="Enter your password"
                style={{
                  width: '100%', padding: '10px 42px 10px 14px', boxSizing: 'border-box',
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text-primary)', fontSize: 14,
                  outline: 'none', fontFamily: 'Inter, sans-serif',
                }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {showPass ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '9px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
              background: 'var(--accent-red-light)', border: '1px solid rgba(220,38,38,0.2)',
              color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertCircle size={16} strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={() => doLogin()}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: loading ? 'var(--bg-input)' : 'linear-gradient(135deg, #2563EB, #1E40AF)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif', boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.25)',
              transition: 'all 0.15s',
            }}
          >{loading ? 'Signing in...' : 'Sign In →'}</button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 16px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: 1 }}>QUICK LOGIN</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Role Quick Login */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_CREDS.map(c => {
              const DemoIcon = c.icon;
              return (
                <button
                  key={c.role}
                  onClick={() => doLogin(c.email, c.password)}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: c.bg, border: `1.5px solid ${c.color}33`,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${c.color}33`; e.currentTarget.style.transform = 'none'; }}
                >
                  <span style={{ color: c.color, display: 'flex', alignItems: 'center' }}>
                    <DemoIcon size={20} strokeWidth={2} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: c.color }}>{c.role}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1, fontFamily: 'monospace' }}>{c.password}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 18 }}>
          TechCorp Solutions Pvt. Ltd. · HRMS v1.0
        </p>
      </div>
    </div>
  );
}
