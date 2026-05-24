'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { TrendingUp, Users, AlertOctagon, AlertTriangle, Activity } from 'lucide-react';

const RISK_COLOR: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const RISK_BADGE: Record<string, string> = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-success' };

export default function BenchmarkingPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([api.getSalaryBenchmarking(), api.getBenchmarkingSummary()])
      .then(([d, s]) => { setData(d as any[]); setSummary(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const filtered = data
    .filter(d => filter === 'all' || d.retention_risk === filter)
    .filter(d => !search || d.full_name.toLowerCase().includes(search.toLowerCase()) || d.designation.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#6c63ff', display: 'flex', alignItems: 'center' }}>
            <TrendingUp size={28} strokeWidth={2} />
          </div>
          <h1 style={{ margin: 0 }}>Salary Benchmarking</h1>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} strokeWidth={2} />
          </div>
          <div className="stat-info"><div className="stat-label">Total Analyzed</div><div className="stat-value">{summary?.total_employees || 0}</div></div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('high')}>
          <div className="stat-icon red" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOctagon size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">High Risk</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{summary?.high_risk || 0}</div>
            <div className="stat-change negative">Below market 25th %ile</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('medium')}>
          <div className="stat-icon orange" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Medium Risk</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{summary?.medium_risk || 0}</div>
            <div className="stat-change">Below median</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Avg Gap vs Median</div>
            <div className="stat-value" style={{ fontSize: 18 }}>
              {summary?.avg_gap_from_median >= 0 ? '+' : ''}{formatCurrency(Math.abs(summary?.avg_gap_from_median || 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="page-filters">
        <input className="filter-input" placeholder="Search by name or designation..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Designation</th>
              <th>Current CTC</th>
              <th>Market P25</th>
              <th>Market Median</th>
              <th>Market P75</th>
              <th>Gap vs Median</th>
              <th>Position</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => {
              const gapPositive = emp.gap_from_median >= 0;
              return (
                <tr key={emp.employee_id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/employees/${emp.employee_id}`)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{emp.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{emp.department}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{emp.designation}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(emp.current_ctc)}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{formatCurrency(emp.market_p25)}</td>
                  <td style={{ fontSize: 13 }}>{formatCurrency(emp.market_p50)}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{formatCurrency(emp.market_p75)}</td>
                  <td style={{ fontWeight: 700, color: gapPositive ? 'var(--accent-green)' : '#ef4444' }}>
                    {gapPositive ? '+' : ''}{formatCurrency(emp.gap_from_median)}
                    <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-tertiary)' }}>
                      {gapPositive ? '+' : ''}{emp.gap_percent}%
                    </div>
                  </td>
                  <td>
                    {/* Visual bar */}
                    <div style={{ width: 120, position: 'relative' }}>
                      <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          width: `${Math.min(Math.max((emp.current_ctc / emp.market_p90) * 100, 5), 100)}%`,
                          background: RISK_COLOR[emp.retention_risk],
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3 }}>{emp.percentile_label}</div>
                    </div>
                  </td>
                  <td><span className={`badge ${RISK_BADGE[emp.retention_risk]}`}>{emp.retention_risk}</span></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>No results found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
