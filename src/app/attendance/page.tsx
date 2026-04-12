'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Employee } from '@/types';
import { getInitials } from '@/lib/utils';

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.getEmployees()
      .then(data => setEmployees((data as Employee[]).filter(e => e.employment_status === 'active')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async (empId: number) => {
    try {
      await api.checkIn(empId);
      setCheckedIn(prev => new Set(prev).add(empId));
    } catch (e: any) { alert(e.message); }
  };

  const handleCheckOut = async (empId: number) => {
    try {
      const result: any = await api.checkOut(empId);
      alert(`Checked out! Work hours: ${result.work_hours}`);
      setCheckedIn(prev => { const s = new Set(prev); s.delete(empId); return s; });
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>📅 Attendance</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginTop: 4 }}>{today}</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <div className="stat-label">Checked In</div>
            <div className="stat-value">{checkedIn.size}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⏳</div>
          <div className="stat-info">
            <div className="stat-label">Not Yet</div>
            <div className="stat-value">{employees.length - checkedIn.size}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-info">
            <div className="stat-label">Total Active</div>
            <div className="stat-value">{employees.length}</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                      {getInitials(emp.full_name)}
                    </div>
                    <span style={{ fontWeight: 600 }}>{emp.full_name}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>{emp.employee_id}</td>
                <td>{emp.department_name}</td>
                <td>
                  {checkedIn.has(emp.id) ? (
                    <span className="badge badge-success">Checked In</span>
                  ) : (
                    <span className="badge badge-neutral">Not Checked In</span>
                  )}
                </td>
                <td>
                  {!checkedIn.has(emp.id) ? (
                    <button className="btn btn-sm btn-success" onClick={() => handleCheckIn(emp.id)}>Check In</button>
                  ) : (
                    <button className="btn btn-sm btn-secondary" onClick={() => handleCheckOut(emp.id)}>Check Out</button>
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
