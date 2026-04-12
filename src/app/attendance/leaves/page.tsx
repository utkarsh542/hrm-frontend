'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LeaveRequest } from '@/types';
import { formatDate, getStatusBadgeClass } from '@/lib/utils';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchLeaves = async () => {
    try {
      const data = await api.getLeaves(filter ? `status=${filter}` : '');
      setLeaves(data as LeaveRequest[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, [filter]);

  const handleAction = async (id: number, status: string) => {
    try {
      await api.updateLeave(id, { status });
      fetchLeaves();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🏖️ Leave Management</h1>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon orange">⏳</div>
          <div className="stat-info">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{leaves.filter(l => l.status === 'pending').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <div className="stat-label">Approved</div>
            <div className="stat-value">{leaves.filter(l => l.status === 'approved').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">❌</div>
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
                  {leave.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-success" onClick={() => handleAction(leave.id, 'approved')}>✓</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleAction(leave.id, 'rejected')}>✕</button>
                    </div>
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
