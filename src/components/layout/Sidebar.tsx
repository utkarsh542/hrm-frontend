'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: '📊', href: '/', badge: 0 },
    ],
  },
  {
    title: 'Recruitment',
    items: [
      { label: 'Job Postings', icon: '💼', href: '/recruitment', badge: 0 },
      { label: 'Candidates', icon: '👤', href: '/recruitment/candidates', badge: 0 },
      { label: 'Interviews', icon: '🎯', href: '/interviews', badge: 0 },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Employees', icon: '👥', href: '/employees', badge: 0 },
      { label: 'Attendance', icon: '📅', href: '/attendance', badge: 0 },
      { label: 'Leaves', icon: '🏖️', href: '/attendance/leaves', badge: 0 },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Payroll', icon: '💰', href: '/payroll', badge: 0 },
    ],
  },
  {
    title: 'Growth',
    items: [
      { label: 'Performance', icon: '⭐', href: '/performance', badge: 0 },
    ],
  },
  {
    title: 'Exit',
    items: [
      { label: 'Offboarding', icon: '🚪', href: '/offboarding', badge: 0 },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">H</div>
        <span className="logo-text">HRMS</span>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-toggle">
        <button onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? '→' : '←'}
        </button>
      </div>
    </aside>
  );
}
