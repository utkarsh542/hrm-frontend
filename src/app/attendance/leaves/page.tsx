'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LeaveRequest } from '@/types';
import { formatDate, getStatusBadgeClass } from '@/lib/utils';
import { Palmtree, Clock, CheckCircle2, XCircle, Check, X, Plus, AlertCircle } from 'lucide-react';
import { useRole } from '@/lib/useRole';

export default function LeavesPage() {
  const { isAdminOrHR, isAdminHROrManager, email, role } = useRole();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [balances, setBalances] = useState<any>(null);
  const [currentEmp, setCurrentEmp] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchLeaves = async () => {
    try {
      const [data, emps]: any = await Promise.all([
        api.getLeaves(filter ? `status=${filter}` : ''),
        api.getEmployees()
      ]);
      setLeaves(data as LeaveRequest[]);

      // Map current logged-in employee record
      const matched = emps.find((e: any) => e.email === email);
      if (matched) {
        setCurrentEmp(matched);
        const bal: any = await api.getLeaveBalance(matched.id);
        setBalances(bal);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, [filter]);

  const handleAction = async (id: number, status: string) => {
    try {
      await api.updateLeave(id, { status });
      fetchLeaves();
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!startDate || !endDate || !reason || !reason.trim()) {
      setError('Please fill out all fields with valid information.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    if (!currentEmp) {
      setError('Error: Employee profile not found.');
      return;
    }
    setSubmitting(true);
    try {
      await api.applyLeave({
        employee_id: currentEmp.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
      });
      setSuccess('Leave request submitted successfully!');
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveType('casual');
      fetchLeaves();
      setTimeout(() => {
        setSuccess(null);
        setShowApplyModal(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#6c63ff', display: 'flex', alignItems: 'center' }}>
            <Palmtree size={28} strokeWidth={2} />
          </div>
          <h1 style={{ margin: 0 }}>Leave Management</h1>
        </div>
        {role !== 'admin' && (
          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => { setError(null); setSuccess(null); setShowApplyModal(true); }}>
            <Plus size={16} /> Apply Leave
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon orange" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{leaves.filter(l => l.status === 'pending').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Approved</div>
            <div className="stat-value">{leaves.filter(l => l.status === 'approved').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Rejected</div>
            <div className="stat-value">{leaves.filter(l => l.status === 'rejected').length}</div>
          </div>
        </div>
      </div>

      <div className="page-filters">
        <select className="filter-input" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map(leave => (
              <tr key={leave.id}>
                <td style={{ fontWeight: 600 }}>{leave.employee_name}</td>
                <td><span className="badge badge-info">{leave.leave_type}</span></td>
                <td>{formatDate(leave.start_date)}</td>
                <td>{formatDate(leave.end_date)}</td>
                <td style={{ fontWeight: 700 }}>{leave.days}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{leave.reason || '—'}</td>
                <td><span className={`badge ${getStatusBadgeClass(leave.status)}`}>{leave.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {leave.status === 'pending' && isAdminHROrManager && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => handleAction(leave.id, 'approved')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px' }} title="Approve">
                          <Check size={14} strokeWidth={2.5} />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleAction(leave.id, 'rejected')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px' }} title="Reject">
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                    {(leave.status === 'pending' || leave.status === 'approved') && 
                     (leave.employee_id === currentEmp?.id || isAdminOrHR) && (
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => handleAction(leave.id, 'cancelled')} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 4, 
                          fontSize: 11, 
                          padding: '4px 10px', 
                          background: 'rgba(239,68,68,0.1)', 
                          color: '#f87171', 
                          border: '1px solid rgba(239,68,68,0.2)' 
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                  No leave requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => { setError(null); setSuccess(null); setShowApplyModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Time Off</h2>
              <button className="modal-close" onClick={() => { setError(null); setSuccess(null); setShowApplyModal(false); }}>✕</button>
            </div>
            <form onSubmit={handleApplyLeave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, color: '#f87171' }} />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.05)'
                  }}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#34d399' }} />
                    <span>{success}</span>
                  </div>
                )}
                {balances && (
                  <div style={{
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '12px 16px', display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Casual</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 2 }}>{balances.casual} d</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Sick</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)', marginTop: 2 }}>{balances.sick} d</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Earned</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-light)', marginTop: 2 }}>{balances.earned} d</div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="form-select" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                    <option value="casual">Casual Leave {balances ? `(${balances.casual} available)` : ''}</option>
                    <option value="sick">Sick Leave {balances ? `(${balances.sick} available)` : ''}</option>
                    <option value="earned">Earned Leave {balances ? `(${balances.earned} available)` : ''}</option>
                  </select>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Notes</label>
                  <textarea
                    className="form-textarea"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Brief explanation for leave request..."
                    rows={3}
                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setError(null); setSuccess(null); setShowApplyModal(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
