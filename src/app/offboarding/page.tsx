'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Resignation } from '@/types';
import { formatDate, formatCurrency, getStatusBadgeClass } from '@/lib/utils';
import { useRole } from '@/lib/useRole';
import { 
  LogOut, Clock, CheckCircle2, DollarSign, CreditCard, 
  FileText, ClipboardList, Send, AlertTriangle,
  Calendar, FileSignature
} from 'lucide-react';

const STATUS_STEPS = ['submitted', 'manager_approved', 'hr_processing', 'exit_interview', 'final_settlement', 'completed'];

export default function OffboardingPage() {
  const { role, email, isAdminOrHR } = useRole();
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignForm, setResignForm] = useState({ reason: '', notice_period_days: 30 });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [resigs, emps] = await Promise.all([
        api.getResignations(),
        api.getEmployees(),
      ]);
      setResignations(resigs as Resignation[]);
      setEmployees(emps as any[]);
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

  const currentEmp = employees.find(e => e.email === email);
  const myResignation = resignations.length > 0 && !isAdminOrHR ? resignations[0] : null;

  const handleSubmitResignation = async () => {
    if (!currentEmp) {
      alert("Employee profile not found. Please sync with administrator.");
      return;
    }
    if (!resignForm.reason.trim()) {
      alert("Please provide a reason for resignation.");
      return;
    }
    if (Number(resignForm.notice_period_days) <= 0) {
      alert("Notice period must be at least 1 day.");
      return;
    }
    setSubmitting(true);
    try {
      await api.submitResignation({
        employee_id: currentEmp.id,
        reason: resignForm.reason,
        notice_period_days: Number(resignForm.notice_period_days)
      });
      setShowResignModal(false);
      fetchData();
    } catch (e: any) { 
      alert(e.message); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center' }}>
            <LogOut size={28} strokeWidth={2} />
          </div>
          <h1 style={{ margin: 0 }}>{isAdminOrHR ? 'Offboarding' : 'My Offboarding'}</h1>
        </div>
        {!isAdminOrHR && !myResignation && (
          <button className="btn btn-primary" onClick={() => setShowResignModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FileSignature size={16} />
            <span>Apply for Resignation</span>
          </button>
        )}
      </div>

      {isAdminOrHR ? (
        // ADMIN / HR INTERFACE
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon orange" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-label">In Progress</div>
                <div className="stat-value">{resignations.filter(r => r.status !== 'completed').length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{resignations.filter(r => r.status === 'completed').length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} strokeWidth={2} />
              </div>
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
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{r.employee_code}</td>
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
                          <button className="btn btn-sm btn-secondary" onClick={() => handleCalculateSettlement(r.id)} style={{ fontSize: 10, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CreditCard size={11} />
                            <span>F&F</span>
                          </button>
                        )}
                        {r.status !== 'completed' && (
                          <>
                            <a href={api.generateExperienceLetter(r.id)} target="_blank" className="btn btn-sm btn-ghost" style={{ fontSize: 10, padding: '3px 8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FileText size={11} />
                              <span>Exp</span>
                            </a>
                            <a href={api.generateRelievingLetter(r.id)} target="_blank" className="btn btn-sm btn-ghost" style={{ fontSize: 10, padding: '3px 8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FileText size={11} />
                              <span>Rel</span>
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {resignations.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>No resignations in progress.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Status Pipeline Visual */}
          {resignations.filter(r => r.status !== 'completed').length > 0 && (
            <div className="card" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={16} style={{ color: 'var(--primary)' }} />
                <span>Exit Pipeline</span>
              </h3>
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
                        <span key={step} style={{ color: i <= currentStep ? 'var(--primary)' : undefined, fontWeight: i === currentStep ? 700 : 400 }}>
                          {step.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        // EMPLOYEE / USER INTERFACE
        <>
          {myResignation ? (
            <div className="responsive-grid-2" style={{ gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Resignation Banner */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--accent-red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)' }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Resignation Active</h2>
                      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        Submitted on {formatDate(myResignation.resignation_date)}
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em', marginBottom: 4 }}>Reason for Leaving</div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                      "{myResignation.reason}"
                    </p>
                  </div>
                </div>

                {/* Exit Pipeline Progress Visual */}
                <div className="card">
                  <h3 style={{ fontSize: 15, marginBottom: 24, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClipboardList size={16} style={{ color: 'var(--primary)' }} />
                    <span>My Offboarding Progress</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {STATUS_STEPS.map((step, idx) => {
                      const currentStep = STATUS_STEPS.indexOf(myResignation.status);
                      const isCompleted = idx < currentStep;
                      const isActive = idx === currentStep;
                      return (
                        <div key={step} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div style={{
                              position: 'absolute',
                              left: 18,
                              top: 24,
                              bottom: -24,
                              width: 2,
                              background: isCompleted ? 'var(--primary)' : 'var(--bg-input)',
                              zIndex: 1
                            }}></div>
                          )}
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: isCompleted || isActive ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-input)',
                            border: `2px solid ${isCompleted ? 'var(--primary)' : isActive ? 'var(--primary)' : 'var(--border)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isCompleted ? 'var(--primary)' : isActive ? 'var(--primary)' : 'var(--text-tertiary)',
                            fontWeight: 700,
                            zIndex: 2
                          }}>
                            {isCompleted ? <CheckCircle2 size={18} /> : idx + 1}
                          </div>
                          <div style={{ paddingTop: 6 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                              {step.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                              {step === 'submitted' && 'Resignation formal proposal recorded.'}
                              {step === 'manager_approved' && 'Team manager review and handoff complete.'}
                              {step === 'hr_processing' && 'HR exit clearance checklist initialized.'}
                              {step === 'exit_interview' && 'Exit interview feedback and appraisal details.'}
                              {step === 'final_settlement' && 'Salary pending payments and final calculations.'}
                              {step === 'completed' && 'Corporate profiles cleared and account suspended.'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Side Panel for Dates & Documents */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={16} style={{ color: 'var(--primary)' }} />
                    <span>Important Timeline</span>
                  </h3>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Notice Period</span>
                      <span style={{ fontWeight: 600 }}>{myResignation.notice_period_days} Days</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Last Working Day</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {myResignation.last_working_day ? formatDate(myResignation.last_working_day) : 'Calculating...'}
                      </span>
                    </div>
                    {myResignation.total_settlement > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>F&F Settlement</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                          {formatCurrency(myResignation.total_settlement)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Letters Download Section */}
                {(myResignation.experience_letter_generated || myResignation.relieving_letter_generated) && (
                  <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} style={{ color: 'var(--primary)' }} />
                      <span>Corporate Letters</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {myResignation.experience_letter_generated && (
                        <a href={api.generateExperienceLetter(myResignation.id)} target="_blank" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }}>
                          <FileText size={16} />
                          <span>Download Experience Letter</span>
                        </a>
                      )}
                      {myResignation.relieving_letter_generated && (
                        <a href={api.generateRelievingLetter(myResignation.id)} target="_blank" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }}>
                          <FileText size={16} />
                          <span>Download Relieving Letter</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // NO ACTIVE RESIGNATION PANEL
            <div className="card" style={{ maxWidth: 650, margin: '40px auto', padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <LogOut size={32} />
                </div>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 10 }}>Resignation Policy & Submission</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
                To initiate offboarding, please submit a formal resignation request. Your default notice period is <strong>30 days</strong>. Upon submission, HR and your manager will be notified to review and calculate your final settlement balance.
              </p>

              <button className="btn btn-primary" onClick={() => setShowResignModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: 14 }}>
                <FileSignature size={18} />
                <span>Submit My Resignation</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Resignation Application Modal */}
      {showResignModal && (
        <div className="modal-overlay" onClick={() => setShowResignModal(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Apply for Resignation</h2>
              <button className="modal-close" onClick={() => setShowResignModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 12, backgroundColor: 'var(--accent-red-light)', border: '1px solid var(--accent-red)', padding: 12, borderRadius: 8, marginBottom: 20, color: 'var(--accent-red)' }}>
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <strong>Important Notice</strong>: Submitting a resignation is a formal request that automatically notifies HR and triggers notice calculations.
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Notice Period (Days) *</label>
                <input className="form-input" type="number" value={resignForm.notice_period_days} onChange={e => setResignForm({...resignForm, notice_period_days: Number(e.target.value)})} min={1} />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Resignation *</label>
                <textarea className="form-input" value={resignForm.reason} onChange={e => setResignForm({...resignForm, reason: e.target.value})} placeholder="Please provide your formal reason for leaving the company..." rows={4} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResignModal(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmitResignation} disabled={submitting} style={{ backgroundColor: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>
                {submitting ? 'Submitting...' : 'Submit Resignation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
