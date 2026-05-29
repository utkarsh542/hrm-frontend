'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/types';
import {
  LayoutDashboard, BarChart3, Briefcase, UserSearch, Sparkles, Target,
  Users, Rocket, Building2, CalendarDays, ScanFace, Palmtree, FolderOpen,
  Wallet, CreditCard, TrendingUp, Star, Brain, HeartPulse, Eye,
  CheckCircle2, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { ReactNode } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentUser: User | null;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

type Role = 'admin' | 'hr' | 'manager' | 'employee';

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  roles: Role[];
}

interface NavSection {
  title: string;
  roles: Role[];
  items: NavItem[];
}

const iconSize = 18;
const iconStroke = 1.8;

const navSections: NavSection[] = [
  {
    title: 'Overview',
    roles: ['admin', 'hr', 'manager', 'employee'],
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard size={iconSize} strokeWidth={iconStroke} />, href: '/', roles: ['admin', 'hr', 'manager', 'employee'] },
      { label: 'Analytics', icon: <BarChart3 size={iconSize} strokeWidth={iconStroke} />, href: '/analytics', roles: ['admin', 'hr'] },
    ],
  },
  {
    title: 'Recruitment',
    roles: ['admin', 'hr', 'manager'],
    items: [
      { label: 'Job Postings', icon: <Briefcase size={iconSize} strokeWidth={iconStroke} />, href: '/recruitment', roles: ['admin', 'hr', 'manager'] },
      { label: 'Candidates', icon: <UserSearch size={iconSize} strokeWidth={iconStroke} />, href: '/recruitment/candidates', roles: ['admin', 'hr', 'manager'] },
      { label: 'Smart Hire AI', icon: <Sparkles size={iconSize} strokeWidth={iconStroke} />, href: '/recruitment/smart-hire', roles: ['admin', 'hr'] },
    ],
  },
  {
    title: 'People',
    roles: ['admin', 'hr', 'manager', 'employee'],
    items: [
      { label: 'Employees', icon: <Users size={iconSize} strokeWidth={iconStroke} />, href: '/employees', roles: ['admin', 'hr', 'manager'] },
      { label: 'Onboarding', icon: <Rocket size={iconSize} strokeWidth={iconStroke} />, href: '/onboarding', roles: ['admin', 'hr', 'manager'] },
      { label: 'Org Chart', icon: <Building2 size={iconSize} strokeWidth={iconStroke} />, href: '/org-chart', roles: ['admin', 'hr', 'manager', 'employee'] },
      { label: 'Attendance', icon: <CalendarDays size={iconSize} strokeWidth={iconStroke} />, href: '/attendance', roles: ['admin', 'hr', 'manager', 'employee'] },
      { label: 'Leaves', icon: <Palmtree size={iconSize} strokeWidth={iconStroke} />, href: '/attendance/leaves', roles: ['admin', 'hr', 'manager', 'employee'] },
      { label: 'Documents', icon: <FolderOpen size={iconSize} strokeWidth={iconStroke} />, href: '/documents', roles: ['admin', 'hr', 'manager', 'employee'] },
      { label: 'Activities', icon: <CalendarDays size={iconSize} strokeWidth={iconStroke} />, href: '/activities', roles: ['admin', 'hr', 'manager', 'employee'] },
    ],
  },
  {
    title: 'Finance',
    roles: ['admin', 'hr', 'manager', 'employee'],
    items: [
      { label: 'Payroll', icon: <Wallet size={iconSize} strokeWidth={iconStroke} />, href: '/payroll', roles: ['admin', 'hr'] },
      { label: 'Expenses', icon: <CreditCard size={iconSize} strokeWidth={iconStroke} />, href: '/expenses', roles: ['admin', 'hr', 'manager', 'employee'] },
      { label: 'Benchmarking', icon: <TrendingUp size={iconSize} strokeWidth={iconStroke} />, href: '/benchmarking', roles: ['admin', 'hr'] },
    ],
  },
  {
    title: 'Growth',
    roles: ['admin', 'hr', 'manager', 'employee'],
    items: [
      { label: 'Performance', icon: <Star size={iconSize} strokeWidth={iconStroke} />, href: '/performance', roles: ['admin', 'hr', 'manager', 'employee'] },
      { label: 'Skills & Training', icon: <Brain size={iconSize} strokeWidth={iconStroke} />, href: '/skills', roles: ['admin', 'hr', 'manager', 'employee'] },
      { label: 'Engagement', icon: <HeartPulse size={iconSize} strokeWidth={iconStroke} />, href: '/engagement', roles: ['admin', 'hr', 'manager'] },
      { label: 'Attrition Risk', icon: <Eye size={iconSize} strokeWidth={iconStroke} />, href: '/attrition', roles: ['admin', 'hr'] },
    ],
  },
  {
    title: 'Approvals',
    roles: ['admin', 'hr', 'manager'],
    items: [
      { label: 'Approval Center', icon: <CheckCircle2 size={iconSize} strokeWidth={iconStroke} />, href: '/approvals', roles: ['admin', 'hr', 'manager'] },
    ],
  },
  {
    title: 'Exit',
    roles: ['admin', 'hr', 'employee'],
    items: [
      { label: 'Offboarding', icon: <LogOut size={iconSize} strokeWidth={iconStroke} />, href: '/offboarding', roles: ['admin', 'hr', 'employee'] },
    ],
  },
];

export default function Sidebar({ 
  collapsed, 
  onToggle, 
  currentUser,
  mobileOpen,
  setMobileOpen 
}: SidebarProps) {
  const pathname = usePathname();
  const role = (currentUser?.role ?? 'employee') as Role;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    // Sibling pages shouldn't highlight parent routes with identical prefixes
    if (href === '/recruitment') return pathname === '/recruitment';
    if (href === '/attendance') return pathname === '/attendance';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const visibleSections = navSections
    .filter(s => s.roles.includes(role))
    .map(s => ({
      ...s,
      items: s.items.filter(i => i.roles.includes(role)),
    }))
    .filter(s => s.items.length > 0);

  const roleColors: Record<Role, string> = {
    admin: '#ef4444',
    hr: '#6c63ff',
    manager: '#f59e0b',
    employee: '#10b981',
  };

  const roleLabels: Record<Role, string> = {
    admin: 'Administrator',
    hr: 'HR Manager',
    manager: 'Team Manager',
    employee: 'Employee',
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">H</div>
        <span className="logo-text">HRMS</span>
      </div>

      {/* Role Badge */}
      {!collapsed && currentUser && (
        <div style={{
          margin: '0 12px 16px',
          padding: '10px 12px',
          borderRadius: 10,
          background: 'var(--bg-input)',
          border: `1px solid ${roleColors[role]}33`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `${roleColors[role]}22`,
              border: `2px solid ${roleColors[role]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: roleColors[role],
              flexShrink: 0,
            }}>
              {currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.full_name}
              </div>
              <div style={{ fontSize: 11, color: roleColors[role], fontWeight: 600 }}>
                {roleLabels[role]}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setMobileOpen && setMobileOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-toggle">
        <button onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
