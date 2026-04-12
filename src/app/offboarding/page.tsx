'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Resignation } from '@/types';
import { formatDate, formatCurrency, getStatusBadgeClass } from '@/lib/utils';

const STATUS_STEPS = ['submitted', 'manager_approved', 'hr_processing', 'exit_interview', 'final_settlement', 'completed'];

export default function OffboardingPage() {
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Resignation | null>(null);

  const fetchData = async () => {
    try {
      const data = await api.getResignations();
      setResignations(data as Resignation[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdvance = async (id: number, currentStatus: string) => {
    const idx = STATUS_STEPS.indexOf(currentStatus);
    if (idx < STATUS_STEPS.length - 1) {
      try {
        await api.updateResignation(id, { status: STATUS_STEPS[idx + 1] });
        fetchData();
      } catch (e: any) { alert(e.message); }
    }
  };

  const handleCalculateSettlement = async (id: number) => {
    try {
      const result: any = await api.calculateSettlement(id);
      alert(`Settlement Calculated:\n\nPending Salary: ₹${result.pending_salary}\nLeave Encashment: ₹${result.leave_encashment}\nGratuity: ₹${result.gratuity}\n\nTotal: ₹${result.total_settlement}`);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🚪 Offboarding</h1>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon orange">⏳</div>
          <div className="stat-info">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{resignations.filter(r => r.status !== 'completed').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{resignations.filter(r => r.status === 'completed').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">💰</div>
          <div className="stat-info">
            <div className="stat-label">Total Settlement</div>
            <div className="stat-value">{formatCurrency(resignations.reduce((s, r) => s + r.total_settlement, 0))}</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Code</th>
              <th>Department</th>
              <th>Resignation Date</th>
              <th>Last Working Day</th>
              <th>Notice</th>
              <th>Status</th>
              <th>Docs</th>
              <th>Settlement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resignations.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.employee_name}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>{r.employee_code}</td>
                <td>{r.department}</td>
                <td>{formatDate(r.resignation_date)}</td>
                <td>{r.last_working_day ? formatDate(r.last_working_day) : '—'}</td>
                <td>{r.notice_period_days} days</td>
                <td><span className={`badge ${getStatusBadgeClass(r.status.split('_')[0])}`}>{r.status.replace(/_/g, ' ')}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {r.experience_letter_generated && <span className="badge badge-success" style={{ fontSize: 9 }}>EXP</span>}
                    {r.relieving_letter_generated && <span className="badge badge-success" style={{ fontSize: 9 }}>REL</span>}
                    {r.exit_interview_done && <span className="badge badge-info" style={{ fontSize: 9 }}>EXIT</span>}
                  </div>
                </td>
                <td style={{ fontWeight: 700 }}>{r.total_settlement > 0 ? formatCurrency(r.total_settlement) : '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {r.status !== 'completed' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleAdvance(r.id, r.status)} style={{ fontSize: 10, padding: '3px 8px' }}>
                        Next →
                      </button>
                    )}
                    {!r.total_settlement && (
                      <button className="btn btn-sm btn-secondary" onClick={() => handleCalculateSettlement(r.id)} style={{ fontSize: 10, padding: '3px 8px' }}>
                        💰 F&F
                      </button>
                    )}
                    {r.status !== 'completed' && (
                      <>
                        <a href={api.generateExperienceLetter(r.id)} target="_blank" className="btn btn-sm btn-ghost" style={{ fontSize: 10, padding: '3px 8px', textDecoration: 'none' }}>
                          📄 Exp
                        </a>
                        <a href={api.generateRelievingLetter(r.id)} target="_blank" className="btn btn-sm btn-ghost" style={{ fontSize: 10, padding: '3px 8px', textDecoration: 'none' }}>
                          📄 Rel
                        </a>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {resignations.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>No resignations.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status Pipeline Visual */}
      {resignations.filter(r => r.status !== 'completed').length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16, color: 'var(--text-secondary)' }}>📋 Exit Pipeline</h3>
          {resignations.filter(r => r.status !== 'completed').map(r => {
            const currentStep = STATUS_STEPS.indexOf(r.status);
            return (
              <div key={r.id} style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{r.employee_name} ({r.employee_code})</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        height: 6, flex: 1, borderRadius: 3,
                        background: i <= currentStep ? 'linear-gradient(90deg, var(--primary), var(--accent-purple))' : 'var(--bg-input)',
                        transition: 'background 0.5s ease',
                      }}></div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {STATUS_STEPS.map((step, i) => (
                    <span key={step} style={{ color: i <= currentStep ? 'var(--primary-light)' : undefined, fontWeight: i === currentStep ? 700 : 400 }}>
                      {step.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
