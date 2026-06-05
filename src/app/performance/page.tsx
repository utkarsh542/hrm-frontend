'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PerformanceReview, Goal } from '@/types';
import { getStatusBadgeClass } from '@/lib/utils';
import { useRole, RoleGuard } from '@/lib/useRole';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, FileText, CheckCircle2, Target, BarChart3, Award, Plus } from 'lucide-react';

export default function PerformancePage() {
  const { isAdminHROrManager, isAdminOrHR, role } = useRole();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'reviews' | 'goals'>('reviews');

  // Modal controls
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms data
  const [reviewForm, setReviewForm] = useState({
    employee_id: '',
    cycle: 'annual',
    period: new Date().getFullYear().toString(),
  });

  const [updateForm, setUpdateForm] = useState({
    technical_rating: 3,
    communication_rating: 3,
    leadership_rating: 3,
    teamwork_rating: 3,
    innovation_rating: 3,
    manager_review: '',
    recommendation: 'none',
  });

  const loadData = async () => {
    try {
      const promises: Promise<any>[] = [api.getReviews(), api.getGoals()];
      if (isAdminHROrManager) {
        promises.push(api.getEmployees());
      }
      const [r, g, emps] = await Promise.all(promises);
      setReviews(r as PerformanceReview[]);
      setGoals(g as Goal[]);
      if (emps) setEmployees(emps.filter((e: any) => e.is_active));
    } catch (e) {
      console.error("Error loading performance metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const handleStartReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.employee_id || !reviewForm.period) {
      alert("Please select an employee and specify a review period.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createReview({
        employee_id: Number(reviewForm.employee_id),
        cycle: reviewForm.cycle,
        period: reviewForm.period,
      });
      setShowReviewModal(false);
      setReviewForm({ employee_id: '', cycle: 'annual', period: new Date().getFullYear().toString() });
      await loadData();
      alert("Performance review cycle initiated successfully!");
    } catch (err: any) {
      alert("Failed to start review: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    if (!updateForm.manager_review || !updateForm.manager_review.trim()) {
      alert("Please provide the manager's review remarks and feedback before completing the review.");
      return;
    }
    setSubmitting(true);
    try {
      await api.updateReview(selectedReview.id, {
        ...updateForm,
        status: 'completed',
      });
      setShowUpdateModal(false);
      setSelectedReview(null);
      await loadData();
      alert("Performance scorecard submitted and finalized successfully!");
    } catch (err: any) {
      alert("Failed to submit performance review: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
          <button 
            className="btn btn-primary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setShowReviewModal(true)}
          >
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
                <Bar dataKey="rating" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} />
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
                <th>Actions</th>
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
                  <td>
                    {r.status === 'pending' && isAdminHROrManager && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setSelectedReview(r);
                          setUpdateForm({
                            technical_rating: r.technical_rating || 3,
                            communication_rating: r.communication_rating || 3,
                            leadership_rating: r.leadership_rating || 3,
                            teamwork_rating: r.teamwork_rating || 3,
                            innovation_rating: r.innovation_rating || 3,
                            manager_review: r.manager_review || '',
                            recommendation: r.recommendation || 'none',
                          });
                          setShowUpdateModal(true);
                        }}
                      >
                        Complete
                      </button>
                    )}
                  </td>
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
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{g.progress}%</span>
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

      {/* ── START REVIEW CYCLE MODAL ── */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content animate-scale-in" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Start Performance Review</h2>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
            </div>
            <form onSubmit={handleStartReview}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Employee to Review *</label>
                  <select 
                    className="form-select" 
                    value={reviewForm.employee_id} 
                    onChange={e => setReviewForm({ ...reviewForm, employee_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.designation})</option>
                    ))}
                  </select>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Review Cycle</label>
                    <select 
                      className="form-select" 
                      value={reviewForm.cycle} 
                      onChange={e => setReviewForm({ ...reviewForm, cycle: e.target.value })}
                    >
                      <option value="annual">Annual Review</option>
                      <option value="mid_year">Mid-Year Review</option>
                      <option value="quarterly">Quarterly Review</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Period / Year *</label>
                    <input 
                      className="form-input" 
                      value={reviewForm.period} 
                      onChange={e => setReviewForm({ ...reviewForm, period: e.target.value })}
                      placeholder="e.g. 2026"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !reviewForm.employee_id}>
                  {submitting ? 'Initiating...' : 'Start Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── COMPLETE REVIEW SCORECARD MODAL ── */}
      {showUpdateModal && selectedReview && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content animate-scale-in" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Performance Review</h2>
              <button className="modal-close" onClick={() => setShowUpdateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCompleteReview}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 13 }}>
                  <div>Employee: <strong style={{ color: 'var(--text-primary)' }}>{selectedReview.employee_name}</strong></div>
                  <div style={{ marginTop: 2, color: 'var(--text-secondary)' }}>Cycle: {selectedReview.cycle} · Period: {selectedReview.period}</div>
                </div>

                {[
                  { field: 'technical_rating', label: 'Technical Knowledge Rating' },
                  { field: 'communication_rating', label: 'Communication & Soft Skills' },
                  { field: 'leadership_rating', label: 'Leadership & Project Ownership' },
                  { field: 'teamwork_rating', label: 'Team Collaboration & Trust' },
                  { field: 'innovation_rating', label: 'Innovation & Problem Solving' },
                ].map(({ field, label }) => (
                  <div className="form-group" key={field} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span className="form-label" style={{ margin: 0, fontWeight: 500 }}>{label}</span>
                      <strong style={{ color: 'var(--primary)' }}>{(updateForm as any)[field]} / 5</strong>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="0.5" 
                      value={(updateForm as any)[field]} 
                      onChange={e => setUpdateForm({ ...updateForm, [field]: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                  </div>
                ))}

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Recommendation</label>
                    <select 
                      className="form-select" 
                      value={updateForm.recommendation} 
                      onChange={e => setUpdateForm({ ...updateForm, recommendation: e.target.value })}
                    >
                      <option value="none">No Recommendation</option>
                      <option value="promote">Recommend Promotion</option>
                      <option value="increment">Recommend Salary Increment</option>
                      <option value="pip">Recommend Performance Improvement Plan (PIP)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Manager Review & Detailed Comments *</label>
                  <textarea
                    className="form-textarea"
                    value={updateForm.manager_review}
                    onChange={e => setUpdateForm({ ...updateForm, manager_review: e.target.value })}
                    placeholder="Provide a comprehensive summary of strengths, areas of improvement, and general assessment..."
                    rows={4}
                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Finalize & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
