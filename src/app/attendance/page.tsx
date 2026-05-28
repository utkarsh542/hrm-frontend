'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Employee, AttendanceRecord } from '@/types';
import { getInitials, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { useRole } from '@/lib/useRole';
import { Calendar, UserCheck, UserMinus, Clock, Users, History, SlidersHorizontal, Info } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const YEARS = [2026, 2025, 2024];

export default function AttendancePage() {
  const { isAdminHROrManager, email } = useRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const fetchData = async (m: number, y: number) => {
    setLoading(true);
    try {
      const [emps, recs]: any = await Promise.all([
        api.getEmployees(),
        api.getAttendance(`month=${m}&year=${y}`),
      ]);
      setEmployees((emps as Employee[]).filter(e => e.employment_status === 'active'));
      setRecords(recs as AttendanceRecord[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedMonth, selectedYear);
  }, []);

  const handleMonthChange = (m: number) => {
    setSelectedMonth(m);
    fetchData(m, selectedYear);
  };

  const handleYearChange = (y: number) => {
    setSelectedYear(y);
    fetchData(selectedMonth, y);
  };

  // Build today's record map
  const todayRecords = new Map<number, AttendanceRecord>();
  records.forEach(r => {
    if (r.date === todayStr) todayRecords.set(r.employee_id, r);
  });

  // Filtered records for History Tab
  const filteredRecords = records.filter(r => {
    const matchesEmployee = selectedEmployeeId === 'all' || r.employee_id === Number(selectedEmployeeId);
    const matchesStatus = selectedStatus === 'all' || r.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesEmployee && matchesStatus;
  });

  // Employees only see themselves; admin/hr/manager see all
  const displayEmployees = isAdminHROrManager ? employees : employees.filter(e => e.email === email);

  const handleCheckIn = async (empId: number) => {
    try {
      await api.checkIn(empId);
      await fetchData(selectedMonth, selectedYear);
    } catch (e: any) { alert(e.message); }
  };

  const handleCheckOut = async (empId: number) => {
    try {
      const result: any = await api.checkOut(empId);
      alert(`Checked out! Work hours: ${result.work_hours}`);
      await fetchData(selectedMonth, selectedYear);
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const checkedInCount = Array.from(todayRecords.values()).filter(r => r.check_in && !r.check_out).length;
  const checkedOutCount = Array.from(todayRecords.values()).filter(r => r.check_in && r.check_out).length;
  const todayLabel = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const tabStyle = (tabId: 'today' | 'history') => ({
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700 as const,
    background: activeTab === tabId ? '#6c63ff' : 'var(--bg-input)',
    color: activeTab === tabId ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#6c63ff', display: 'flex', alignItems: 'center' }}>
            <Calendar size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Attendance</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginTop: 4 }}>
              {activeTab === 'today' ? todayLabel : 'Track employee check-ins and hours historically'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabStyle('today')} onClick={() => setActiveTab('today')}>
          <Calendar size={15} /> Daily Status
        </button>
        <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
          <History size={15} /> Attendance History
        </button>
      </div>

      {activeTab === 'today' && (
        <>
          {isAdminHROrManager && (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
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
        </>
      )}

      {activeTab === 'history' && (
        <>
          {/* Advanced Filters Panel */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <SlidersHorizontal size={13} /> Month
              </label>
              <select className="form-select" value={selectedMonth} onChange={e => handleMonthChange(Number(e.target.value))}>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Year</label>
              <select className="form-select" value={selectedYear} onChange={e => handleYearChange(Number(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {isAdminHROrManager && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Employee</label>
                <select className="form-select" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}>
                  <option value="all">All Employees</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="work_from_home">WFH</option>
              </select>
            </div>
          </div>

          {/* History Data Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {isAdminHROrManager && <th>Employee</th>}
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours Worked</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(rec.date)}</td>
                    {isAdminHROrManager && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontWeight: 600 }}>{rec.employee_name}</span>
                        </div>
                      </td>
                    )}
                    <td style={{ fontSize: 13 }}>
                      {rec.check_in ? new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {rec.check_out ? new Date(rec.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {rec.work_hours ? `${rec.work_hours}h` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(rec.status)}`}>
                        {rec.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={isAdminHROrManager ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <Info size={24} style={{ color: 'var(--text-tertiary)' }} />
                        <span>No historical attendance records found for this period.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
