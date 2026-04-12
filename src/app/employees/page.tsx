'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Employee } from '@/types';
import { formatCurrency, formatDate, getStatusBadgeClass, getInitials } from '@/lib/utils';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', designation: '', department_id: 0,
    employment_type: 'full_time', ctc: 0, joining_date: new Date().toISOString().split('T')[0],
    gender: '', pan_number: '', bank_account: '', bank_name: '',
  });

  const fetchData = async () => {
    try {
      const [emps, depts] = await Promise.all([
        api.getEmployees(search ? `search=${search}` : ''),
        api.getDepartments()
      ]);
      setEmployees(emps as Employee[]);
      setDepartments(depts as any[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search]);

  const handleCreate = async () => {
    try {
      await api.createEmployee(formData);
      setShowCreateModal(false);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>👥 Employee Directory</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Add Employee</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-info">
            <div className="stat-label">Total</div>
            <div className="stat-value">{employees.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <div className="stat-label">Active</div>
            <div className="stat-value">{employees.filter(e => e.employment_status === 'active').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⏳</div>
          <div className="stat-info">
            <div className="stat-label">On Notice</div>
            <div className="stat-value">{employees.filter(e => e.employment_status === 'on_notice').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🏢</div>
          <div className="stat-info">
            <div className="stat-label">Departments</div>
            <div className="stat-value">{departments.length}</div>
          </div>
        </div>
      </div>

      <div className="page-filters">
        <input className="filter-input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by name, email, or employee ID..." style={{ width: 320 }} />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Type</th>
              <th>Joining Date</th>
              <th>CTC</th>
              <th>Status</th>
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
                    <div>
                      <div style={{ fontWeight: 600 }}>{emp.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>{emp.employee_id}</td>
                <td>{emp.department_name}</td>
                <td>{emp.designation}</td>
                <td><span className="badge badge-info">{emp.employment_type.replace('_', ' ')}</span></td>
                <td>{formatDate(emp.joining_date)}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(emp.ctc)}</td>
                <td><span className={`badge ${getStatusBadgeClass(emp.employment_status)}`}>{emp.employment_status.replace('_', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={formData.department_id} onChange={e => setFormData({...formData, department_id: +e.target.value})}>
                    <option value={0}>Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input className="form-input" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Annual CTC (₹)</label>
                  <input className="form-input" type="number" value={formData.ctc} onChange={e => setFormData({...formData, ctc: +e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Joining Date</label>
                  <input className="form-input" type="date" value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Add Employee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
