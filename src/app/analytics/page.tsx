'use client';
import { useState, useEffect } from 'react';
import {
  BarChart3, Users, Wallet, TrendingDown, UserPlus, Briefcase,
  Building2, Sparkles, CheckCircle, AlertTriangle, Target,
} from 'lucide-react';

const API = 'https://hrm-backend-dtxm.onrender.com/api';
const hdrs = () => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) } as Record<string, string>;
};

export default function AnalyticsPage() {
  const [workforce, setWorkforce] = useState<any>(null);
  const [hiring, setHiring] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [compensation, setCompensation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [w, h, i, c] = await Promise.all([
        fetch(`${API}/analytics/workforce`, { headers: hdrs() }).then(r => r.json()),
        fetch(`${API}/analytics/hiring`, { headers: hdrs() }).then(r => r.json()),
        fetch(`${API}/analytics/ai-insights`, { headers: hdrs() }).then(r => r.json()),
        fetch(`${API}/analytics/compensation`, { headers: hdrs() }).then(r => r.json()),
      ]);
      setWorkforce(w); setHiring(h); setInsights(i); setCompensation(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

  if (loading) return <div className="animate-fade-in" style={{ padding: 32 }}><p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p></div>;

  const maxDeptCount = workforce?.department_distribution ? Math.max(...workforce.department_distribution.map((d: any) => d.count), 1) : 1;
  const maxCompCTC = compensation?.department_compensation ? Math.max(...compensation.department_compensation.map((d: any) => d.avg_ctc), 1) : 1;

  return (
    <div className="animate-fade-in" style={{ padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c63ff' }}>
            <BarChart3 size={20} strokeWidth={2} />
          </div>
          AI Analytics Command Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Workforce intelligence, hiring metrics & AI-powered insights</p>
      </div>

      {/* AI Insights Banner */}
      {insights?.executive_summary && (
        <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(139,92,246,0.1))', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(108,99,255,0.3)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={18} style={{ color: '#c4b5fd' }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#c4b5fd' }}>AI Executive Summary</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>{insights.executive_summary}</p>
        </div>
      )}

      {/* Stats Row */}
      {workforce && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Employees', value: workforce.active_employees, Icon: Users, color: '#6c63ff' },
            { label: 'Avg CTC', value: fmt(workforce.avg_ctc), Icon: Wallet, color: '#10b981' },
            { label: 'Attrition Rate', value: `${workforce.attrition_rate}%`, Icon: TrendingDown, color: workforce.attrition_rate > 10 ? '#ef4444' : '#f59e0b' },
            { label: 'New Hires (Month)', value: workforce.new_hires_this_month, Icon: UserPlus, color: '#3b82f6' },
            { label: 'Open Positions', value: hiring?.open_positions || 0, Icon: Briefcase, color: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  <s.Icon size={22} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Department Distribution */}
        {workforce?.department_distribution && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={18} style={{ color: '#6c63ff' }} /> Department Distribution</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {workforce.department_distribution.map((d: any) => (
                <div key={d.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{d.name}</span><span style={{ fontWeight: 700, color: '#6c63ff' }}>{d.count}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-input)' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: '#6c63ff', width: `${(d.count / maxDeptCount) * 100}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gender Distribution */}
        {workforce?.gender_distribution && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} style={{ color: '#6c63ff' }} /> Gender Distribution</h3>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16 }}>
              {[
                { label: 'Male', count: workforce.gender_distribution.male, color: '#3b82f6' },
                { label: 'Female', count: workforce.gender_distribution.female, color: '#ec4899' },
                { label: 'Other', count: workforce.gender_distribution.other, color: '#8b5cf6' },
              ].map(g => (
                <div key={g.label} style={{ textAlign: 'center', padding: '16px 24px', borderRadius: 12, background: `${g.color}15`, border: `1px solid ${g.color}33` }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: g.color, margin: '0 0 4px' }}>{g.count}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{g.label}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 12, borderRadius: 6, display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: `${(workforce.gender_distribution.male / Math.max(workforce.active_employees, 1)) * 100}%`, background: '#3b82f6', transition: 'width 0.5s' }} />
              <div style={{ width: `${(workforce.gender_distribution.female / Math.max(workforce.active_employees, 1)) * 100}%`, background: '#ec4899', transition: 'width 0.5s' }} />
              <div style={{ flex: 1, background: '#8b5cf6' }} />
            </div>
          </div>
        )}

        {/* Tenure Distribution */}
        {workforce?.tenure_distribution && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Target size={18} style={{ color: '#6c63ff' }} /> Tenure Distribution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {Object.entries(workforce.tenure_distribution).map(([label, count]) => {
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                const i = Object.keys(workforce.tenure_distribution).indexOf(label);
                return (
                  <div key={label} style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: `${colors[i]}15`, border: `1px solid ${colors[i]}33` }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: colors[i] }}>{count as number}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Compensation */}
        {compensation?.department_compensation && compensation.department_compensation.length > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Wallet size={18} style={{ color: '#10b981' }} /> Avg CTC by Department</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {compensation.department_compensation.map((d: any) => (
                <div key={d.department}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{d.department}</span><span style={{ fontWeight: 700, color: '#10b981' }}>{fmt(d.avg_ctc)}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-input)' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: '#10b981', width: `${(d.avg_ctc / maxCompCTC) * 100}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {insights?.insights && insights.insights.length > 0 && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={18} style={{ color: '#6c63ff' }} /> AI-Powered Insights</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {insights.insights.map((ins: any, i: number) => {
              const typeC: Record<string, { bg: string; color: string; Icon: any }> = {
                positive: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', Icon: CheckCircle },
                warning: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', Icon: AlertTriangle },
                action: { bg: 'rgba(108,99,255,0.15)', color: '#6c63ff', Icon: Target },
              };
              const tc = typeC[ins.type] || typeC.action;
              const TIcon = tc.Icon;
              return (
                <div key={i} style={{ padding: '16px 20px', borderRadius: 12, background: tc.bg, border: `1px solid ${tc.color}33` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <TIcon size={16} style={{ color: tc.color }} strokeWidth={2} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: tc.color }}>{ins.title}</span>
                    {ins.priority && <span style={{ marginLeft: 'auto', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      background: ins.priority === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(107,114,128,0.2)',
                      color: ins.priority === 'high' ? '#ef4444' : '#9ca3af' }}>{ins.priority.toUpperCase()}</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hiring Analytics */}
      {hiring?.source_effectiveness && hiring.source_effectiveness.length > 0 && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Target size={18} style={{ color: '#6c63ff' }} /> Hiring Source Effectiveness</h3>
          <div className="data-table" style={{ borderRadius: 12, overflow: 'hidden' }}>
            <table>
              <thead><tr><th>Source</th><th>Applications</th><th>Hired</th><th>Conversion Rate</th></tr></thead>
              <tbody>
                {hiring.source_effectiveness.map((s: any) => (
                  <tr key={s.source}>
                    <td style={{ fontWeight: 600 }}>{s.source}</td>
                    <td>{s.applications}</td>
                    <td>{s.hired}</td>
                    <td><span style={{ fontWeight: 700, color: s.conversion_rate > 10 ? '#10b981' : '#f59e0b' }}>{s.conversion_rate}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
