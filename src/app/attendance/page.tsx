'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Employee, AttendanceRecord } from '@/types';
import { getInitials } from '@/lib/utils';
import { useRole } from '@/lib/useRole';
import { Calendar, UserCheck, UserMinus, Clock, Users } from 'lucide-react';

export default function AttendancePage() {
  const { isAdminHROrManager, email } = useRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const fetchData = async () => {
    try {
      const [emps, recs]: any = await Promise.all([
        api.getEmployees(),
        api.getAttendance(`month=${month}&year=${year}`),
      ]);
      setEmployees((emps as Employee[]).filter(e => e.employment_status === 'active'));
      setRecords(recs as AttendanceRecord[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Build today's record map
  const todayRecords = new Map<number, AttendanceRecord>();
  records.forEach(r => {
    if (r.date === todayStr) todayRecords.set(r.employee_id, r);
  });

  // Employees only see themselves; admin/hr/manager see all
  const displayEmployees = isAdminHROrManager ? employees : employees.filter(e => e.email === email);

  const handleCheckIn = async (empId: number) => {
    try {
      await api.checkIn(empId);
      await fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleCheckOut = async (empId: number) => {
    try {
      const result: any = await api.checkOut(empId);
      alert(`Checked out! Work hours: ${result.work_hours}`);
      await fetchData();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const checkedInCount = Array.from(todayRecords.values()).filter(r => r.check_in && !r.check_out).length;
  const checkedOutCount = Array.from(todayRecords.values()).filter(r => r.check_in && r.check_out).length;
  const todayLabel = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#6c63ff', display: 'flex', alignItems: 'center' }}>
            <Calendar size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Attendance</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginTop: 4 }}>{todayLabel}</p>
          </div>
        </div>
      </div>

      {isAdminHROrManager && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={18} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Checked In</div>
              <div className="stat-value">{checkedInCount}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserMinus size={18} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Checked Out</div>
              <div className="stat-value">{checkedOutCount}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Not Yet</div>
              <div className="stat-value">{employees.length - checkedInCount - checkedOutCount}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Active</div>
              <div className="stat-value">{employees.length}</div>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayEmployees.map(emp => {
              const rec = todayRecords.get(emp.id);
              const isIn = !!rec?.check_in && !rec?.check_out;
              const isDone = !!rec?.check_in && !!rec?.check_out;
              return (
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
                  <td style={{ fontSize: 13 }}>
                    {rec?.check_in ? new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {rec?.check_out ? new Date(rec.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {rec?.work_hours ? `${rec.work_hours}h` : '—'}
                  </td>
                  <td>
                    {isDone ? (
                      <span className="badge badge-success">Completed</span>
                    ) : isIn ? (
                      <span className="badge badge-warning">Checked In</span>
                    ) : (
                      <span className="badge badge-neutral">Absent</span>
                    )}
                  </td>
                  <td>
                    {!rec?.check_in ? (
                      <button className="btn btn-sm btn-success" onClick={() => handleCheckIn(emp.id)}>Check In</button>
                    ) : !rec?.check_out ? (
                      <button className="btn btn-sm btn-secondary" onClick={() => handleCheckOut(emp.id)}>Check Out</button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Done</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
