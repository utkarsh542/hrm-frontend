'use client';
import { useState, useEffect } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AICopilot from '@/components/ai/AICopilot';
import LoginPage from '@/components/auth/LoginPage';
import { User } from '@/types';
import { api } from '@/lib/api';

import { AlertTriangle } from 'lucide-react';

function getHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Geofence dynamic states (falls back to Bangalore office defaults)
  const [orgLat, setOrgLat] = useState(12.9716);
  const [orgLon, setOrgLon] = useState(77.5946);
  const [orgRadius, setOrgRadius] = useState(100.0);
  const [orgAddress, setOrgAddress] = useState('TechCorp Head Office');

  // Geofence admin dynamic sync states
  const [adminSyncAddress, setAdminSyncAddress] = useState('');
  const [adminSyncStatus, setAdminSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Geofence violation overlay states
  const [geofenceViolation, setGeofenceViolation] = useState(false);
  const [violationDistance, setViolationDistance] = useState(0);
  const [logoutCountdown, setLogoutCountdown] = useState(5);

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

  // Sync Dynamic Geofence center from API config on mount/login
  useEffect(() => {
    if (!currentUser) return;
    api.getGeofence()
      .then((res: any) => {
        if (res && res.latitude && res.longitude) {
          setOrgLat(res.latitude);
          setOrgLon(res.longitude);
          setOrgRadius(res.radius || 100.0);
          if (res.address) {
            setOrgAddress(res.address);
            setAdminSyncAddress(res.address);
            if (currentUser.role === 'admin') {
              setAdminSyncStatus('synced');
            }
          }
        }
      })
      .catch(console.error);
  }, [currentUser]);

  // Geofence active tracking watcher
  useEffect(() => {
    if (!currentUser) {
      setGeofenceViolation(false);
      return;
    }

    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (currentUser.role === 'admin') {
          const distance = getHaversineDistanceMeters(latitude, longitude, orgLat, orgLon);
          // Sync if position changed significantly (> 2 meters) or has not synced yet
          if (distance > 2.0 || adminSyncStatus === 'idle') {
            setAdminSyncStatus('syncing');
            api.updateGeofence(latitude, longitude, orgRadius)
              .then((res: any) => {
                setOrgLat(latitude);
                setOrgLon(longitude);
                if (res.address) {
                  setOrgAddress(res.address);
                  setAdminSyncAddress(res.address);
                }
                setAdminSyncStatus('synced');
              })
              .catch((err) => {
                console.error("Failed to sync admin location as org geofence:", err);
                setAdminSyncStatus('error');
              });
          }
          setGeofenceViolation(false);
          return;
        }

        const distance = getHaversineDistanceMeters(latitude, longitude, orgLat, orgLon);
        if (distance > orgRadius) {
          setViolationDistance(distance);
          setGeofenceViolation(true);
        } else {
          setGeofenceViolation(false);
        }
      },
      (error) => {
        console.error("Geofence tracking error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [currentUser, orgLat, orgLon, orgRadius, adminSyncStatus]);

  // Geofence countdown watcher
  useEffect(() => {
    if (!geofenceViolation) {
      setLogoutCountdown(5);
      return;
    }

    if (logoutCountdown <= 0) {
      handleLogout();
      setGeofenceViolation(false);
      return;
    }

    const timer = setTimeout(() => {
      setLogoutCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [geofenceViolation, logoutCountdown]);

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
                mobileOpen={mobileSidebarOpen}
                setMobileOpen={setMobileSidebarOpen}
              />
              {mobileSidebarOpen && (
                <div 
                  className="sidebar-backdrop animate-fade-in" 
                  onClick={() => setMobileSidebarOpen(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(10, 10, 20, 0.65)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 150,
                    transition: 'all 0.25s ease',
                  }}
                />
              )}
              <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Header
                  sidebarCollapsed={sidebarCollapsed}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                />
                <div className="page-container">
                  {currentUser.role === 'admin' && adminSyncStatus !== 'idle' && (
                    <div style={{
                      marginBottom: 20,
                      background: 'rgba(30, 41, 59, 0.45)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: 16,
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                      flexWrap: 'wrap',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
                          <span style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: adminSyncStatus === 'synced' ? '#10b981' : adminSyncStatus === 'syncing' ? '#fbbf24' : '#ef4444',
                            display: 'inline-block'
                          }}></span>
                          {adminSyncStatus === 'syncing' && (
                            <span style={{
                              position: 'absolute',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              border: '2px solid #fbbf24',
                              animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                              display: 'inline-block'
                            }}></span>
                          )}
                          {adminSyncStatus === 'synced' && (
                            <span style={{
                              position: 'absolute',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              border: '2px solid #10b981',
                              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                              display: 'inline-block'
                            }}></span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>📍 DYNAMIC OFFICE GEOFENCE</span>
                            <span style={{
                              fontSize: 9,
                              padding: '2px 8px',
                              background: 'rgba(99, 102, 241, 0.2)',
                              color: '#818cf8',
                              borderRadius: 12,
                              fontWeight: 800,
                              letterSpacing: '0.5px'
                            }}>ACTIVE ADMIN SYNC</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {adminSyncStatus === 'syncing' ? 'Synchronizing office boundaries to your physical GPS position...' : 
                             adminSyncStatus === 'synced' ? `Company center set to: ${adminSyncAddress || `${orgLat.toFixed(5)}, ${orgLon.toFixed(5)}`}` : 
                             'Failed to synchronize physical office boundaries.'}
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: 11, 
                        color: 'var(--text-secondary)', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '6px 12px', 
                        borderRadius: 10, 
                        border: '1px solid rgba(255, 255, 255, 0.08)' 
                      }}>
                        GPS: <strong style={{ color: 'var(--text-primary)' }}>{orgLat.toFixed(5)}</strong>, <strong style={{ color: 'var(--text-primary)' }}>{orgLon.toFixed(5)}</strong> (r: {orgRadius}m)
                      </div>
                    </div>
                  )}
                  {children}
                </div>
              </div>
            </div>
            <AICopilot />

            {geofenceViolation && (
              <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(10, 10, 20, 0.85)',
                backdropFilter: 'blur(12px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20
              }}>
                <div style={{
                  background: 'rgba(30, 20, 30, 0.95)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 24,
                  padding: '40px 32px',
                  maxWidth: 480,
                  width: '100%',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  animation: 'scaleIn 0.3s ease'
                }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    margin: '0 auto 24px'
                  }}>
                    <AlertTriangle size={36} strokeWidth={2} className="animate-pulse" />
                  </div>
                  <h2 style={{ fontSize: 22, color: '#f87171', fontWeight: 800, margin: '0 0 12px', letterSpacing: '0.5px' }}>
                    GEOFENCE BOUNDARY VIOLATION
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
                    Security policy requires all active sessions to remain within <strong>100 meters</strong> of the organization. 
                    You are currently <strong>{Math.round(violationDistance)}m</strong> away from TechCorp office boundary.
                  </p>
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: 16,
                    padding: '16px 20px',
                    fontSize: 14,
                    color: '#fca5a5',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12
                  }}>
                    <span className="spinner-sm" style={{ borderLeftColor: '#ef4444', width: 14, height: 14, display: 'inline-block' }}></span>
                    Auto-logging out in {logoutCountdown} second{logoutCountdown !== 1 ? 's' : ''}...
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </body>
    </html>
  );
}
