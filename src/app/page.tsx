'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DashboardStats, HiringFunnelData, DepartmentStats, RecentActivity } from '@/types';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { useRole, RoleGuard } from '@/lib/useRole';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Users, Briefcase, Target, LogOut, Palmtree, Building2, ClipboardList,
} from 'lucide-react';

const COLORS = ['#6c63ff', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];

export default function DashboardPage() {
  const { role, isAdminOrHR, isAdminHROrManager } = useRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [funnel, setFunnel] = useState<HiringFunnelData[]>([]);
  const [deptStats, setDeptStats] = useState<DepartmentStats[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises: Promise<any>[] = [api.getDashboardStats(), api.getRecentActivity()];
        if (isAdminHROrManager) {
          promises.push(api.getHiringFunnel(), api.getDepartmentStats());
        }
        const results = await Promise.all(promises);
        setStats(results[0] as DashboardStats);
        setActivity(results[1] as RecentActivity[]);
        if (isAdminHROrManager) {
          setFunnel(results[2] as HiringFunnelData[]);
          setDeptStats(results[3] as DepartmentStats[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role]);

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const greetings: Record<string, string> = {
    admin: "Full system overview — all modules accessible.",
    hr: "People operations summary — manage your workforce.",
    manager: "Your team's performance and activity at a glance.",
    employee: "Your personal workspace — leaves, attendance, and goals.",
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginTop: 4 }}>
            {greetings[role]}
          </p>
        </div>
      </div>

      {/* ── Admin / HR stats ── */}
      <RoleGuard roles={['admin', 'hr']}>
        <div className="stats-grid">
          <div className="stat-card animate-fade-in stagger-1">
            <div className="stat-icon blue"><Users size={22} strokeWidth={1.8} /></div>
            <div className="stat-info">
              <div className="stat-label">Total Employees</div>
              <div className="stat-value">{stats?.total_employees || 0}</div>
              <div className="stat-change positive">↑ {stats?.new_hires_this_month || 0} new this month</div>
            </div>
          </div>
          <div className="stat-card animate-fade-in stagger-2">
            <div className="stat-icon green"><Briefcase size={22} strokeWidth={1.8} /></div>
            <div className="stat-info">
              <div className="stat-label">Open Positions</div>
              <div className="stat-value">{stats?.open_positions || 0}</div>
              <div className="stat-change positive">{stats?.total_applications || 0} applications</div>
            </div>
          </div>
          <div className="stat-card animate-fade-in stagger-3">
            <div className="stat-icon orange"><Target size={22} strokeWidth={1.8} /></div>
            <div className="stat-info">
              <div className="stat-label">Interviews Today</div>
              <div className="stat-value">{stats?.interviews_today || 0}</div>
              <div className="stat-change">{stats?.pending_leaves || 0} pending leaves</div>
            </div>
          </div>
          <div className="stat-card animate-fade-in stagger-4">
            <div className="stat-icon purple"><LogOut size={22} strokeWidth={1.8} /></div>
            <div className="stat-info">
              <div className="stat-label">Attrition Rate</div>
              <div className="stat-value">{stats?.attrition_rate || 0}%</div>
              <div className="stat-change negative">{stats?.pending_resignations || 0} pending exits</div>
            </div>
          </div>
        </div>
      </RoleGuard>

      {/* ── Manager stats ── */}
      <RoleGuard roles={['manager']}>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card animate-fade-in stagger-1">
            <div className="stat-icon blue"><Users size={22} strokeWidth={1.8} /></div>
            <div className="stat-info">
              <div className="stat-label">Total Employees</div>
              <div className="stat-value">{stats?.total_employees || 0}</div>
            </div>
          </div>
          <div className="stat-card animate-fade-in stagger-2">
            <div className="stat-icon orange"><Target size={22} strokeWidth={1.8} /></div>
            <div className="stat-info">
              <div className="stat-label">Interviews Today</div>
              <div className="stat-value">{stats?.interviews_today || 0}</div>
            </div>
          </div>
          <div className="stat-card animate-fade-in stagger-3">
            <div className="stat-icon green"><Palmtree size={22} strokeWidth={1.8} /></div>
            <div className="stat-info">
              <div className="stat-label">Pending Leaves</div>
              <div className="stat-value">{stats?.pending_leaves || 0}</div>
            </div>
          </div>
        </div>
      </RoleGuard>

      {/* ── Employee stats ── */}
      <RoleGuard roles={['employee']}>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card animate-fade-in stagger-1">
            <div className="stat-icon green"><Palmtree size={22} strokeWidth={1.8} /></div>
            <div className="stat-info">
              <div className="stat-label">Pending Leaves</div>
              <div className="stat-value">{stats?.pending_leaves || 0}</div>
            </div>
          </div>
          <div className="stat-card animate-fade-in stagger-2">
            <div className="stat-icon orange"><Target size={22} strokeWidth={1.8} /></div>
            <div className="stat-info">
              <div className="stat-label">Interviews Today</div>
              <div className="stat-value">{stats?.interviews_today || 0}</div>
            </div>
          </div>
          <div className="stat-card animate-fade-in stagger-3">
            <div className="stat-icon blue"><Briefcase size={22} strokeWidth={1.8} /></div>
            <div className="stat-info">
              <div className="stat-label">Open Positions</div>
              <div className="stat-value">{stats?.open_positions || 0}</div>
            </div>
          </div>
        </div>
      </RoleGuard>

      {/* ── Charts — admin/hr/manager only ── */}
      <RoleGuard roles={['admin', 'hr', 'manager']}>
        <div className="charts-grid">
          <div className="chart-card animate-fade-in stagger-2">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Target size={18} style={{ color: '#6c63ff' }} /> Hiring Funnel</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnel} layout="vertical">
                <XAxis type="number" tick={{ fill: '#6b6b85', fontSize: 12 }} />
                <YAxis dataKey="stage" type="category" width={80} tick={{ fill: '#a0a0b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e1e35', border: '1px solid #2a2a45', borderRadius: 8, color: '#f0f0f5' }} />
                <Bar dataKey="count" fill="#6c63ff" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card animate-fade-in stagger-3">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={18} style={{ color: '#6c63ff' }} /> Department Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={deptStats} dataKey="count" nameKey="name" cx="50%" cy="50%"
                  outerRadius={100} innerRadius={50} paddingAngle={3}
                  label={({ name, payload }: any) => `${name}: ${payload?.count ?? ''}`}>
                  {deptStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e1e35', border: '1px solid #2a2a45', borderRadius: 8, color: '#f0f0f5' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </RoleGuard>

      {/* ── Recent Activity ── */}
      <div className="card animate-fade-in stagger-4">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ClipboardList size={16} /> Recent Activity</span>
        </h3>
        <div className="activity-feed">
          {activity.length === 0 && (
            <div className="empty-state" style={{ padding: '30px 20px' }}><p>No recent activity</p></div>
          )}
          {activity.map((item) => (
            <div key={`${item.type}-${item.id}`} className="activity-item">
              <div className={`activity-dot ${item.type}`}></div>
              <div className="activity-text">{item.message}</div>
              <div className="activity-time">{timeAgo(item.timestamp)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
