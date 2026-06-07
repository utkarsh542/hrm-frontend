'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { TrendingDown, Users, AlertOctagon, AlertTriangle, CheckCircle, Lightbulb, ChevronUp, ChevronDown } from 'lucide-react';

interface AttritionRecord {
  employee_id: number;
  employee_code: string;
  full_name: string;
  designation: string;
  department: string;
  tenure_months: number;
  risk_score: number;
  risk_level: 'high' | 'medium' | 'low';
  factors: string[];
  recommendation: string;
}

const RISK_COLOR: Record<string, string> = {
  high: 'var(--accent-red)',
  medium: 'var(--accent-orange)',
  low: 'var(--accent-green)',
};

const RISK_BADGE: Record<string, string> = {
  high: 'badge-danger',
  medium: 'badge-warning',
  low: 'badge-success',
};

export default function AttritionPage() {
  const router = useRouter();
  const [data, setData] = useState<AttritionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    api.getAttritionRisk()
      .then(d => setData(d as AttritionRecord[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const filtered = filter === 'all' ? data : data.filter(d => d.risk_level === filter);
  const high = data.filter(d => d.risk_level === 'high').length;
  const medium = data.filter(d => d.risk_level === 'medium').length;
  const low = data.filter(d => d.risk_level === 'low').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center' }}>
            <TrendingDown size={28} strokeWidth={2} />
          </div>
          <h1 style={{ margin: 0 }}>Attrition Risk</h1>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Analyzed</div>
            <div className="stat-value">{data.length}</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('high')}>
          <div className="stat-icon red" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOctagon size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">High Risk</div>
            <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{high}</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('medium')}>
          <div className="stat-icon orange" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Medium Risk</div>
            <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{medium}</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('low')}>
          <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Low Risk</div>
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{low}</div>
          </div>
        </div>
      </div>

      <div className="page-filters">
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(emp => (
          <div key={emp.employee_id} className="card" style={{ borderLeft: `4px solid ${RISK_COLOR[emp.risk_level]}` }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', flexWrap: 'wrap' }}
              onClick={() => setExpanded(expanded === emp.employee_id ? null : emp.employee_id)}
            >
              {/* Risk Score Ring */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: `conic-gradient(${RISK_COLOR[emp.risk_level]} ${emp.risk_score * 3.6}deg, var(--bg-input) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, color: RISK_COLOR[emp.risk_level],
                }}>
                  {emp.risk_score}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{emp.full_name}</span>
                  <span className={`badge ${RISK_BADGE[emp.risk_level]}`}>{emp.risk_level} risk</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  {emp.designation} · {emp.department} · {emp.tenure_months}mo tenure
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={e => { e.stopPropagation(); router.push(`/employees/${emp.employee_id}`); }}
                >
                  View Profile
                </button>
                <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                  {expanded === emp.employee_id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
            </div>

            {expanded === emp.employee_id && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div className="responsive-grid-2" style={{ gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Risk Factors
                    </div>
                    {emp.factors.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No significant risk factors detected.</p>
                    ) : (
                      <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {emp.factors.map((f, i) => (
                          <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                      AI Recommendation
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <Lightbulb size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                      <span>{emp.recommendation}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
            No employees in this risk category.
          </div>
        )}
      </div>
    </div>
  );
}
