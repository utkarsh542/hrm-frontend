'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PerformanceReview, Goal } from '@/types';
import { getStatusBadgeClass } from '@/lib/utils';
import { useRole, RoleGuard } from '@/lib/useRole';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, FileText, CheckCircle2, Target, BarChart3, Award, Plus } from 'lucide-react';

export default function PerformancePage() {
  const { isAdminHROrManager, isAdminOrHR } = useRole();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'reviews' | 'goals'>('reviews');

  useEffect(() => {
    Promise.all([api.getReviews(), api.getGoals()])
      .then(([r, g]) => { setReviews(r as PerformanceReview[]); setGoals(g as Goal[]); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const ratingData = reviews.filter(r => r.overall_rating).map(r => ({
    name: r.employee_name.split(' ')[0],
    rating: r.overall_rating,
  }));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Award className="text-primary-light" size={28} /> Performance
        </h1>
        <RoleGuard roles={['admin', 'hr', 'manager']}>
          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Start Review
          </button>
        </RoleGuard>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon purple">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Reviews</div>
            <div className="stat-value">{reviews.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{reviews.filter(r => r.status === 'completed').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Target size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Active Goals</div>
            <div className="stat-value">{goals.filter(g => g.status === 'in_progress').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <Star size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Avg Rating</div>
            <div className="stat-value">
              {reviews.filter(r => r.overall_rating).length > 0
                ? (reviews.filter(r => r.overall_rating).reduce((s, r) => s + (r.overall_rating || 0), 0) / reviews.filter(r => r.overall_rating).length).toFixed(1)
                : '—'}
            </div>
          </div>
        </div>
      </div>

      <RoleGuard roles={['admin', 'hr', 'manager']}>
        {ratingData.length > 0 && (
          <div className="chart-card" style={{ marginBottom: 24 }}>
            <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BarChart3 className="text-primary-light" size={18} /> Employee Ratings
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ratingData}>
                <XAxis dataKey="name" tick={{ fill: '#a0a0b8', fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fill: '#6b6b85', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e1e35', border: '1px solid #2a2a45', borderRadius: 8, color: '#f0f0f5' }} />
                <Bar dataKey="rating" fill="#6c63ff" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </RoleGuard>

      <div className="tabs">
        <button className={`tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>Performance Reviews</button>
        <button className={`tab ${tab === 'goals' ? 'active' : ''}`} onClick={() => setTab('goals')}>Goals</button>
      </div>

      {tab === 'reviews' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Cycle</th>
                <th>Period</th>
                <th>Tech</th>
                <th>Comm</th>
                <th>Lead</th>
                <th>Team</th>
                <th>Overall</th>
                <th>Recommendation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.employee_name}</td>
                  <td><span className="badge badge-info">{r.cycle}</span></td>
                  <td>{r.period || '—'}</td>
                  <td>{r.technical_rating?.toFixed(1) || '—'}</td>
                  <td>{r.communication_rating?.toFixed(1) || '—'}</td>
                  <td>{r.leadership_rating?.toFixed(1) || '—'}</td>
                  <td>{r.teamwork_rating?.toFixed(1) || '—'}</td>
                  <td style={{ fontWeight: 700, color: (r.overall_rating || 0) >= 4 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                    {r.overall_rating?.toFixed(1) || '—'}
                  </td>
                  <td>
                    {r.recommendation && (
                      <span className={`badge ${r.recommendation === 'promote' ? 'badge-success' : r.recommendation === 'pip' ? 'badge-danger' : 'badge-primary'}`}>
                        {r.recommendation}
                      </span>
                    )}
                  </td>
                  <td><span className={`badge ${getStatusBadgeClass(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'goals' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
          {goals.map(g => (
            <div key={g.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h4 style={{ fontSize: 15 }}>{g.title}</h4>
                <span className={`badge ${g.priority === 'high' ? 'badge-danger' : g.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                  {g.priority}
                </span>
              </div>
              {g.description && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12 }}>{g.description}</p>}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Progress</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{g.progress}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${g.progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent-purple))', borderRadius: 3, transition: 'width 0.5s ease' }}></div>
                </div>
              </div>
              <span className={`badge ${getStatusBadgeClass(g.status)}`}>{g.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
