'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Interview } from '@/types';
import { formatDateTime, getStatusBadgeClass } from '@/lib/utils';
import { Target, Calendar, CheckCircle2, Bot } from 'lucide-react';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInterviews()
      .then(data => setInterviews(data as Interview[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAiInterview = async (id: number) => {
    try {
      const result: any = await api.runAiInterview(id);
      alert(`AI Interview Complete!\n\nOverall Score: ${result.evaluation.overall_score}/5\nRecommendation: ${result.evaluation.recommendation}\n\n${result.evaluation.feedback}`);
      const data = await api.getInterviews();
      setInterviews(data as Interview[]);
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#6c63ff', display: 'flex', alignItems: 'center' }}>
            <Target size={28} strokeWidth={2} />
          </div>
          <h1 style={{ margin: 0 }}>Interviews</h1>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Scheduled</div>
            <div className="stat-value">{interviews.filter(i => i.status === 'scheduled').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{interviews.filter(i => i.status === 'completed').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">AI Interviews</div>
            <div className="stat-value">{interviews.filter(i => i.ai_score).length}</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Job</th>
              <th>Type</th>
              <th>Scheduled</th>
              <th>Duration</th>
              <th>Interviewer</th>
              <th>Score</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map(interview => (
              <tr key={interview.id}>
                <td style={{ fontWeight: 600 }}>{interview.candidate_name}</td>
                <td>{interview.job_title}</td>
                <td><span className="badge badge-info">{interview.interview_type.replace('_', ' ')}</span></td>
                <td>{formatDateTime(interview.scheduled_at)}</td>
                <td>{interview.duration_minutes} min</td>
                <td>{interview.interviewer_name || '—'}</td>
                <td>
                  {interview.overall_score ? (
                    <span style={{ fontWeight: 700, color: interview.overall_score >= 4 ? 'var(--accent-green)' : interview.overall_score >= 3 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>
                      {interview.overall_score}/5
                    </span>
                  ) : '—'}
                </td>
                <td><span className={`badge ${getStatusBadgeClass(interview.status)}`}>{interview.status}</span></td>
                <td>
                  {interview.status === 'scheduled' && (
                    <button className="btn btn-sm btn-primary" onClick={() => handleAiInterview(interview.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Bot size={13} />
                      <span>AI Interview</span>
                    </button>
                  )}
                  {interview.recommendation && (
                    <span className={`badge ${interview.recommendation === 'hire' ? 'badge-success' : interview.recommendation === 'reject' ? 'badge-danger' : 'badge-warning'}`} style={{ marginLeft: 4 }}>
                      {interview.recommendation}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
