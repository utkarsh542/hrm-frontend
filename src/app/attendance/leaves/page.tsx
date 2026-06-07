'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LeaveRequest } from '@/types';
import { formatDate, getStatusBadgeClass } from '@/lib/utils';
import { Palmtree, Clock, CheckCircle2, XCircle, Check, X, Plus, AlertCircle, CalendarDays, Edit2 } from 'lucide-react';
import { useRole } from '@/lib/useRole';

export default function LeavesPage() {
  const { isAdminOrHR, isAdminHROrManager, email, role } = useRole();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  // Leave Apply Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [balances, setBalances] = useState<any>(null);
  const [currentEmp, setCurrentEmp] = useState<any>(null);

  // Leave Edit Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<any | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editLeaveType, setEditLeaveType] = useState('casual');
  const [editReason, setEditReason] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  
  // Notification states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tabs states
  const [activeTab, setActiveTab] = useState<'requests' | 'holidays' | 'compoff'>('requests');

  // Comp-off state hooks
  const [compoffRequests, setCompoffRequests] = useState<any[]>([]);
  const [eligibleDates, setEligibleDates] = useState<any[]>([]);
  const [pendingCompoffs, setPendingCompoffs] = useState<any[]>([]);
  const [compoffRule, setCompoffRule] = useState<any>(null);
  const [showApplyCompoffModal, setShowApplyCompoffModal] = useState(false);
  const [selectedCompoffDate, setSelectedCompoffDate] = useState('');
  const [compoffReason, setCompoffReason] = useState('');
  const [compoffSubmitting, setCompoffSubmitting] = useState(false);
  const [editRuleMode, setEditRuleMode] = useState(false);
  const [ruleStandardHours, setRuleStandardHours] = useState(8);
  const [ruleMinOt, setRuleMinOt] = useState(2);
  const [ruleSaving, setRuleSaving] = useState(false);

  // Holidays states
  const [holidays, setHolidays] = useState<any[]>([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any | null>(null);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayType, setHolidayType] = useState('national');
  const [holidaySubmitting, setHolidaySubmitting] = useState(false);

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

  const fetchHolidays = async () => {
    try {
      const data = await api.getHolidays();
      setHolidays(data as any[]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCompoffData = async () => {
    try {
      const [myRequests, dates, rule]: any = await Promise.all([
        api.getMyCompOffRequests(),
        api.getEligibleOvertimeDates(),
        api.getCompOffRule()
      ]);
      setCompoffRequests(myRequests);
      setEligibleDates(dates);
      setCompoffRule(rule);
      setRuleStandardHours(rule.standard_working_hours);
      setRuleMinOt(rule.min_overtime_hours);
      
      if (isAdminHROrManager) {
        const approvals = await api.getPendingCompOffApprovals();
        setPendingCompoffs(approvals);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchHolidays();
    fetchCompoffData();
  }, [filter]);

  const handleAction = async (id: number, status: string) => {
    try {
      await api.updateLeave(id, { status });
      fetchLeaves();
      fetchCompoffData();
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleApplyCompoff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedCompoffDate || !compoffReason.trim()) {
      setError('Please select a date and enter a reason.');
      return;
    }
    setCompoffSubmitting(true);
    try {
      await api.createCompOffRequest({
        attendance_date: selectedCompoffDate,
        reason: compoffReason,
      });
      setSuccess('Comp-off request submitted successfully!');
      setSelectedCompoffDate('');
      setCompoffReason('');
      fetchCompoffData();
      fetchLeaves();
      setTimeout(() => {
        setSuccess(null);
        setShowApplyCompoffModal(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit comp-off request.');
    } finally {
      setCompoffSubmitting(false);
    }
  };

  const handleActionCompoff = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      await api.actionCompOffRequest(requestId, action);
      fetchCompoffData();
      fetchLeaves();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCancelCompoff = async (requestId: number) => {
    if (!confirm('Are you sure you want to cancel this comp-off request?')) return;
    try {
      await api.cancelCompOffRequest(requestId);
      setSuccess('Comp-off request cancelled successfully!');
      fetchCompoffData();
      fetchLeaves();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel comp-off request.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleSaving(true);
    try {
      await api.updateCompOffRule({
        standard_working_hours: Number(ruleStandardHours),
        min_overtime_hours: Number(ruleMinOt),
      });
      setSuccess('Comp-off policy rules updated successfully!');
      setEditRuleMode(false);
      fetchCompoffData();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setRuleSaving(false);
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

  const handleOpenEditModal = (leave: any) => {
    setError(null);
    setSuccess(null);
    setEditingLeave(leave);
    setEditStartDate(leave.start_date);
    setEditEndDate(leave.end_date);
    setEditLeaveType(leave.leave_type);
    setEditReason(leave.reason || '');
    setShowEditModal(true);
  };

  const handleEditLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!editStartDate || !editEndDate || !editReason || !editReason.trim()) {
      setError('Please fill out all fields with valid information.');
      return;
    }
    if (new Date(editStartDate) > new Date(editEndDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    setEditSubmitting(true);
    try {
      await api.updateLeave(editingLeave.id, {
        start_date: editStartDate,
        end_date: editEndDate,
        leave_type: editLeaveType,
        reason: editReason,
      });
      setSuccess('Leave request updated successfully!');
      fetchLeaves();
      fetchCompoffData();
      setTimeout(() => {
        setSuccess(null);
        setShowEditModal(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update leave request.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleOpenAddHolidayModal = () => {
    setError(null);
    setSuccess(null);
    setEditingHoliday(null);
    setHolidayName('');
    setHolidayDate('');
    setHolidayType('national');
    setShowHolidayModal(true);
  };

  const handleOpenEditHolidayModal = (h: any) => {
    setError(null);
    setSuccess(null);
    setEditingHoliday(h);
    setHolidayName(h.name);
    setHolidayDate(h.date);
    setHolidayType(h.type || 'national');
    setShowHolidayModal(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!holidayName.trim() || !holidayDate) {
      setError('Please fill in both name and date.');
      return;
    }
    setHolidaySubmitting(true);
    try {
      if (editingHoliday) {
        // Edit Mode
        await api.updateHoliday(editingHoliday.id, {
          name: holidayName,
          date: holidayDate,
          type: holidayType,
        });
        setSuccess('Official holiday updated successfully!');
      } else {
        // Create Mode
        await api.createHoliday({
          name: holidayName,
          date: holidayDate,
          type: holidayType,
        });
        setSuccess('Official holiday registered successfully!');
      }
      setHolidayName('');
      setHolidayDate('');
      setHolidayType('national');
      setEditingHoliday(null);
      fetchHolidays();
      setTimeout(() => {
        setSuccess(null);
        setShowHolidayModal(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save holiday.');
    } finally {
      setHolidaySubmitting(false);
    }
  };

  const getLeaveRangeValidation = (start: string, end: string) => {
    if (!start || !end) return { valid: true, days: 0, reason: '' };
    const sDate = new Date(start);
    const eDate = new Date(end);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) return { valid: true, days: 0, reason: '' };
    if (sDate > eDate) return { valid: false, days: 0, reason: 'Start date cannot be after end date.' };

    let daysCount = 0;
    const curr = new Date(sDate);
    let iterations = 0;
    while (curr <= eDate && iterations < 366) {
      iterations++;
      const dayOfWeek = curr.getDay(); // 0: Sunday, 6: Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const holiday = holidays.find(h => h.date === dateStr);

      if (isWeekend) {
        const dayName = curr.toLocaleDateString('en-US', { weekday: 'long' });
        return { 
          valid: false, 
          days: 0, 
          reason: `Selected range includes a weekend: ${curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} is a ${dayName}. Leave requests are only permitted for active working days.` 
        };
      }
      if (holiday) {
        return { 
          valid: false, 
          days: 0, 
          reason: `Selected range includes an official holiday: ${curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} is "${holiday.name}".` 
        };
      }
      daysCount++;
      curr.setDate(curr.getDate() + 1);
    }
    return { valid: true, days: daysCount, reason: '' };
  };

  const validation = getLeaveRangeValidation(startDate, endDate);
  const editValidation = getLeaveRangeValidation(editStartDate, editEndDate);

  const showApproveButtons = (req: any) => {
    if (role === 'admin') {
      return req.hr_status === 'pending' || req.manager_status === 'pending';
    }
    if (role === 'hr') {
      return req.hr_status === 'pending';
    }
    if (role === 'manager') {
      return req.manager_status === 'pending';
    }
    return false;
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const isHRorAdmin = role === 'admin' || role === 'hr';

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            <Palmtree size={28} strokeWidth={2} />
          </div>
          <h1 style={{ margin: 0 }}>Leave & Holiday Management</h1>
        </div>
        {activeTab === 'requests' && role !== 'admin' && (
          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => { setError(null); setSuccess(null); setShowApplyModal(true); }}>
            <Plus size={16} /> Apply Leave
          </button>
        )}
        {activeTab === 'holidays' && isHRorAdmin && (
          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAddHolidayModal}>
            <Plus size={16} /> Add Holiday
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
          <Palmtree size={15} /> Leave Requests
        </button>
        <button className={`tab ${activeTab === 'holidays' ? 'active' : ''}`} onClick={() => setActiveTab('holidays')}>
          <CalendarDays size={15} /> Official Holidays
        </button>
        <button className={`tab ${activeTab === 'compoff' ? 'active' : ''}`} onClick={() => setActiveTab('compoff')}>
          <CalendarDays size={15} /> Comp-off (Earn & Config)
        </button>
      </div>

      {error && !showApplyModal && !showHolidayModal && !showApplyCompoffModal && (
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
          marginBottom: 20
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, color: '#f87171' }} />
          <span>{error}</span>
        </div>
      )}
      {success && !showApplyModal && !showHolidayModal && !showApplyCompoffModal && (
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
          marginBottom: 20
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#34d399' }} />
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'requests' && (
        <>
          {/* Leave Balances Dashboard Header */}
          {balances && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Your Available Leave Balances</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>Balances will be automatically adjusted upon approval.</p>
              </div>
              <div className="leave-balances-flex">
                <div className="leave-balance-item">
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Casual Leave</span>
                  <strong style={{ fontSize: 16, color: 'var(--accent-orange)' }}>{balances.casual} days</strong>
                </div>
                <div className="leave-balance-item">
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sick Leave</span>
                  <strong style={{ fontSize: 16, color: 'var(--accent-green)' }}>{balances.sick} days</strong>
                </div>
                <div className="leave-balance-item">
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earned Leave</span>
                  <strong style={{ fontSize: 16, color: '#818cf8' }}>{balances.earned} days</strong>
                </div>
                <div className="leave-balance-item">
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comp-off Balance</span>
                  <strong style={{ fontSize: 16, color: '#38bdf8' }}>{currentEmp?.comp_off_balance || 0} days</strong>
                </div>
              </div>
            </div>
          )}

          <div className="stats-grid">
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
                        {leave.status === 'pending' && 
                         (leave.employee_id === currentEmp?.id || isAdminOrHR) && (
                          <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={() => handleOpenEditModal(leave)} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 4, 
                              fontSize: 11, 
                              padding: '4px 10px', 
                              background: 'rgba(37,99,235,0.1)', 
                              color: '#a78bfa', 
                              border: '1px solid rgba(37,99,235,0.2)',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit2 size={11} /> Edit
                          </button>
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
                              border: '1px solid rgba(239,68,68,0.2)',
                              cursor: 'pointer'
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
        </>
      )}

      {activeTab === 'holidays' && (
        <div className="table-container animate-fade-in">
          <table className="data-table">
            <thead>
              <tr>
                <th>Holiday Name</th>
                <th>Date</th>
                <th>Day of Week</th>
                <th>Type</th>
                {isHRorAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {holidays.map(h => {
                const hDate = new Date(h.date);
                const dayName = hDate.toLocaleDateString('en-US', { weekday: 'long' });
                return (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600 }}>{h.name}</td>
                    <td>{formatDate(h.date)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{dayName}</td>
                    <td>
                      <span className={`badge ${h.type === 'national' ? 'badge-danger' : h.type === 'regional' ? 'badge-info' : 'badge-warning'}`}>
                        {h.type ? h.type.toUpperCase() : 'NATIONAL'}
                      </span>
                    </td>
                    {isHRorAdmin && (
                      <td>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px' }} 
                          onClick={() => handleOpenEditHolidayModal(h)}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {holidays.length === 0 && (
                <tr>
                  <td colSpan={isHRorAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    No official holidays registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: 10, textAlign: 'center'
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
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>{balances.earned} d</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Comp-off</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 2 }}>{currentEmp?.comp_off_balance || 0} d</div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="form-select" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                    <option value="casual">Casual Leave {balances ? `(${balances.casual} available)` : ''}</option>
                    <option value="sick">Sick Leave {balances ? `(${balances.sick} available)` : ''}</option>
                    <option value="earned">Earned Leave {balances ? `(${balances.earned} available)` : ''}</option>
                    <option value="compensatory">Compensatory Leave (Comp-off) {currentEmp ? `(${currentEmp.comp_off_balance || 0} available)` : ''}</option>
                  </select>

                  {leaveType === 'compensatory' && (
                    <div style={{
                      marginTop: 8,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.06)',
                      border: '1px solid rgba(56, 189, 248, 0.15)',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      color: 'var(--text-secondary)'
                    }}>
                      <strong>💡 Compensatory Leave (Comp-off) Guideline:</strong><br />
                      • This leave uses your earned Comp-off balance (current: <strong>{currentEmp?.comp_off_balance || 0} days</strong>).<br />
                      • In the Start/End Date fields below, choose the date(s) you want to <strong>take off</strong>.<br />
                      {(!currentEmp?.comp_off_balance || currentEmp.comp_off_balance <= 0) && (
                        <span style={{ color: '#fca5a5', display: 'block', marginTop: 6, fontWeight: 500 }}>
                          ⚠️ You have 0 Comp-off days available. To earn balance, go to the "Comp-off (Earn & Config)" tab, click "Apply" next to an overtime date, and get approval.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-row" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  </div>
                </div>

                {startDate && endDate && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    background: validation.valid ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                    border: validation.valid ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
                    color: validation.valid ? '#a7f3d0' : '#fca5a5'
                  }}>
                    {validation.valid ? (
                      <span>Requested Duration: <strong>{validation.days} {validation.days === 1 ? 'working day' : 'working days'}</strong></span>
                    ) : (
                      <span>{validation.reason}</span>
                    )}
                  </div>
                )}

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
                <button type="submit" className="btn btn-primary" disabled={submitting || !validation.valid || (leaveType === 'compensatory' && (!currentEmp?.comp_off_balance || currentEmp.comp_off_balance < (validation.days || 1)))}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Leave Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => { setError(null); setSuccess(null); setShowEditModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Leave Request</h2>
              <button className="modal-close" onClick={() => { setError(null); setSuccess(null); setShowEditModal(false); }}>✕</button>
            </div>
            <form onSubmit={handleEditLeave}>
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
                  }}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#34d399' }} />
                    <span>{success}</span>
                  </div>
                )}
                {balances && (
                  <div style={{
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '12px 16px', display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: 10, textAlign: 'center'
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
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>{balances.earned} d</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Comp-off</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 2 }}>{currentEmp?.comp_off_balance || 0} d</div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="form-select" value={editLeaveType} onChange={e => setEditLeaveType(e.target.value)}>
                    <option value="casual">Casual Leave {balances ? `(${balances.casual} available)` : ''}</option>
                    <option value="sick">Sick Leave {balances ? `(${balances.sick} available)` : ''}</option>
                    <option value="earned">Earned Leave {balances ? `(${balances.earned} available)` : ''}</option>
                    <option value="compensatory">Compensatory Leave (Comp-off) {currentEmp ? `(${currentEmp.comp_off_balance || 0} available)` : ''}</option>
                  </select>

                  {editLeaveType === 'compensatory' && (
                    <div style={{
                      marginTop: 8,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.06)',
                      border: '1px solid rgba(56, 189, 248, 0.15)',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      color: 'var(--text-secondary)'
                    }}>
                      <strong>💡 Compensatory Leave (Comp-off) Guideline:</strong><br />
                      • This leave uses your earned Comp-off balance (current: <strong>{currentEmp?.comp_off_balance || 0} days</strong>).<br />
                      • In the Start/End Date fields below, choose the date(s) you want to <strong>take off</strong>.<br />
                      {(!currentEmp?.comp_off_balance || currentEmp.comp_off_balance <= 0) && (
                        <span style={{ color: '#fca5a5', display: 'block', marginTop: 6, fontWeight: 500 }}>
                          ⚠️ You have 0 Comp-off days available. To earn balance, go to the "Comp-off (Earn & Config)" tab, click "Apply" next to an overtime date, and get approval.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-row" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="form-input" type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} required />
                  </div>
                </div>

                {editStartDate && editEndDate && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    background: editValidation.valid ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                    border: editValidation.valid ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
                    color: editValidation.valid ? '#a7f3d0' : '#fca5a5'
                  }}>
                    {editValidation.valid ? (
                      <span>Requested Duration: <strong>{editValidation.days} {editValidation.days === 1 ? 'working day' : 'working days'}</strong></span>
                    ) : (
                      <span>{editValidation.reason}</span>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Reason / Notes</label>
                  <textarea
                    className="form-textarea"
                    value={editReason}
                    onChange={e => setEditReason(e.target.value)}
                    placeholder="Brief explanation for leave request..."
                    rows={3}
                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setError(null); setSuccess(null); setShowEditModal(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting || !editValidation.valid || (editLeaveType === 'compensatory' && (!currentEmp?.comp_off_balance || currentEmp.comp_off_balance < (editValidation.days || 1)))}>
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Holiday Modal */}
      {showHolidayModal && (
        <div className="modal-overlay" onClick={() => { setError(null); setSuccess(null); setShowHolidayModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingHoliday ? 'Edit Official Holiday' : 'Add Official Holiday'}</h2>
              <button className="modal-close" onClick={() => { setError(null); setSuccess(null); setShowHolidayModal(false); }}>✕</button>
            </div>
            <form onSubmit={handleSaveHoliday}>
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
                  }}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#34d399' }} />
                    <span>{success}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Holiday Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={holidayName}
                    onChange={e => setHolidayName(e.target.value)}
                    placeholder="e.g. Independence Day, Diwali"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={holidayDate}
                    onChange={e => setHolidayDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Holiday Type</label>
                  <select className="form-select" value={holidayType} onChange={e => setHolidayType(e.target.value)}>
                    <option value="national">National Holiday</option>
                    <option value="regional">Regional Holiday</option>
                    <option value="optional">Optional Holiday</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setError(null); setSuccess(null); setShowHolidayModal(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={holidaySubmitting}>
                  {holidaySubmitting ? 'Saving...' : editingHoliday ? 'Save Changes' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'compoff' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Guide Card */}
          <div style={{
            background: 'rgba(37, 99, 235, 0.05)',
            border: '1px solid rgba(37, 99, 235, 0.15)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.03)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} style={{ color: '#818cf8' }} /> How Comp-off Works (Earn & Use Guide)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>1</div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600 }}>Work Overtime</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Complete a shift exceeding standard hours ({compoffRule?.standard_working_hours || 8}h) by the min overtime requirement ({compoffRule?.min_overtime_hours || 2}h).
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>2</div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600 }}>Request Credit</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Find the date in the <strong>Eligible Overtime Dates</strong> list below, click <strong>Apply</strong>, and submit details.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>3</div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600 }}>Get Dual Approval</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Your balance (currently <strong>{currentEmp?.comp_off_balance || 0} days</strong>) will increase by 1.0 day once both your Manager and HR approve.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>4</div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600 }}>Take Leave</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Go to <strong>Leave Requests</strong> tab, click <strong>Apply Leave</strong>, choose <strong>Compensatory Leave</strong>, and submit!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top overview metrics */}
          <div className="stats-grid" style={{ gridTemplateColumns: isAdminHROrManager ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr' }}>
            <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Palmtree size={20} />
                </div>
                <div>
                  <div className="stat-label">Comp-off Balance</div>
                  <div className="stat-value" style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)' }}>
                    {currentEmp?.comp_off_balance || 0} days
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 220 }}>
                Earned by working extra hours. Apply for "Compensatory Leave" under requests tab to use.
              </div>
            </div>

            {isAdminHROrManager && compoffRule && (
              <div className="stat-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Comp-off Policy Rules</h3>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      setEditRuleMode(!editRuleMode);
                    }}
                    style={{ fontSize: 12 }}
                  >
                    {editRuleMode ? 'Cancel' : 'Edit Rule'}
                  </button>
                </div>

                {editRuleMode ? (
                  <form onSubmit={handleSaveRule} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Standard Shift (Hours)</label>
                        <input 
                          type="number" 
                          step="0.5"
                          className="form-input" 
                          value={ruleStandardHours} 
                          onChange={e => setRuleStandardHours(Number(e.target.value))} 
                          required
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Min Overtime (Hours)</label>
                        <input 
                          type="number" 
                          step="0.5"
                          className="form-input" 
                          value={ruleMinOt} 
                          onChange={e => setRuleMinOt(Number(e.target.value))} 
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', minHeight: 'auto' }} disabled={ruleSaving}>
                      {ruleSaving ? 'Saving...' : 'Save'}
                    </button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 11 }}>Standard Shift</span>
                      <strong style={{ fontSize: 16 }}>{compoffRule.standard_working_hours} hours</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 11 }}>Min Overtime Required</span>
                      <strong style={{ fontSize: 16 }}>{compoffRule.min_overtime_hours} hours</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pending approvals section for Manager/HR */}
          {isAdminHROrManager && (
            <div className="card animate-fade-in">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>Pending Comp-off Approvals</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Overtime Date</th>
                      <th>Work Hours</th>
                      <th>Overtime</th>
                      <th>Reason</th>
                      <th>Manager Status</th>
                      <th>HR Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCompoffs.map(req => (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 600 }}>{req.employee_name}</td>
                        <td>{formatDate(req.attendance_date)}</td>
                        <td>{req.working_hours} hrs</td>
                        <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>+{req.overtime_hours} hrs</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.reason || '—'}</td>
                        <td>
                          <span className={`badge ${req.manager_status === 'approved' ? 'badge-success' : req.manager_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {req.manager_status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${req.hr_status === 'approved' ? 'badge-success' : req.hr_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {req.hr_status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {showApproveButtons(req) ? (
                              <>
                                <button className="btn btn-sm btn-success" onClick={() => handleActionCompoff(req.id, 'approve')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px' }} title="Approve">
                                  <Check size={14} strokeWidth={2.5} />
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleActionCompoff(req.id, 'reject')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px' }} title="Reject">
                                  <X size={14} strokeWidth={2.5} />
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                {role === 'hr' && req.hr_status === 'approved' && "Waiting for Manager"}
                                {role === 'manager' && req.manager_status === 'approved' && "Waiting for HR"}
                                {role === 'admin' && req.hr_status === 'approved' && req.manager_status === 'approved' && "Approved"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingCompoffs.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: 14 }}>
                          No pending comp-off approvals found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Two Columns: Eligible Overtime Dates & Request History */}
          <div className="responsive-grid-2" style={{ gap: 24 }}>
            {/* Eligible Dates */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Eligible Overtime Dates</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: -8, marginBottom: 16 }}>
                Dates you worked more than standard shift by at least {compoffRule?.min_overtime_hours || 2} hours.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                {eligibleDates.map(d => (
                  <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{formatDate(d.date)}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Worked: {d.work_hours} hrs (Overtime: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>+{d.overtime_hours} hrs</span>)
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ padding: '6px 12px', fontSize: 12, minHeight: 'auto' }}
                      onClick={() => {
                        setError(null);
                        setSuccess(null);
                        setSelectedCompoffDate(d.date);
                        setCompoffReason('');
                        setShowApplyCompoffModal(true);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                ))}
                {eligibleDates.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-tertiary)', fontSize: 14 }}>
                    No eligible overtime dates found. Complete shifts with extra hours to earn.
                  </div>
                )}
              </div>
            </div>

            {/* My Requests History */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>My Comp-off Requests</h3>
              <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Overtime Date</th>
                      <th>Overtime</th>
                      <th>Reason</th>
                      <th>Manager</th>
                      <th>HR</th>
                      <th>Final Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compoffRequests.map(r => (
                      <tr key={r.id}>
                        <td>{formatDate(r.attendance_date)}</td>
                        <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>+{r.overtime_hours} hrs</td>
                        <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reason || '—'}</td>
                        <td>
                          <span className={`badge ${r.manager_status === 'approved' ? 'badge-success' : r.manager_status === 'rejected' ? 'badge-danger' : r.manager_status === 'rejected' ? 'badge-danger' : r.manager_status === 'cancelled' ? 'badge-secondary' : 'badge-warning'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                            {r.manager_status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${r.hr_status === 'approved' ? 'badge-success' : r.hr_status === 'rejected' ? 'badge-danger' : r.hr_status === 'cancelled' ? 'badge-secondary' : 'badge-warning'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                            {r.hr_status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(r.status)}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {(r.status === 'pending' || r.status === 'approved') && (
                            <button 
                              className="btn btn-sm btn-secondary" 
                              onClick={() => handleCancelCompoff(r.id)} 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                fontSize: 10, 
                                padding: '2px 8px', 
                                background: 'rgba(239,68,68,0.1)', 
                                color: '#f87171', 
                                border: '1px solid rgba(239,68,68,0.2)',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {compoffRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontSize: 14 }}>
                          No requested comp-offs yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Comp-off Modal */}
      {showApplyCompoffModal && (
        <div className="modal-overlay" onClick={() => { setError(null); setSuccess(null); setShowApplyCompoffModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Comp-off Credit</h2>
              <button className="modal-close" onClick={() => { setError(null); setSuccess(null); setShowApplyCompoffModal(false); }}>✕</button>
            </div>
            <form onSubmit={handleApplyCompoff}>
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
                  }}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#34d399' }} />
                    <span>{success}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Overtime Date (Date You Worked Extra)</label>
                  <input
                    className="form-input"
                    type="date"
                    value={selectedCompoffDate}
                    onChange={e => setSelectedCompoffDate(e.target.value)}
                    required
                  />
                  <div style={{
                    marginTop: 8,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(37, 99, 235, 0.05)',
                    border: '1px solid rgba(37, 99, 235, 0.15)',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    color: 'var(--text-secondary)'
                  }}>
                    <strong>💡 Important Workflow Info:</strong><br />
                    1. Enter the date you worked extra here to request <strong>1.0 day of credit</strong>.<br />
                    2. Once approved by Manager and HR, your Comp-off balance increases.<br />
                    3. To take your day off, go to the <strong>Leave Requests</strong> tab, click <strong>Apply Leave</strong>, and choose <strong>Compensatory Leave</strong> for the day you want to be absent.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Working Details</label>
                  <textarea
                    className="form-textarea"
                    value={compoffReason}
                    onChange={e => setCompoffReason(e.target.value)}
                    placeholder="Describe the tasks completed during overtime..."
                    rows={3}
                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setError(null); setSuccess(null); setShowApplyCompoffModal(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={compoffSubmitting}>
                  {compoffSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
