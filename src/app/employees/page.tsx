'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Employee } from '@/types';
import { formatCurrency, formatDate, getStatusBadgeClass, getInitials } from '@/lib/utils';
import { useRole, RoleGuard } from '@/lib/useRole';
import { Users, UserCheck, Clock, Building2, Copy, Check, ShieldCheck, Mail, Lock, AlertCircle } from 'lucide-react';

export default function EmployeesPage() {
  const router = useRouter();
  const { isAdminOrHR } = useRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', designation: '', department_id: 0,
    employment_type: 'full_time', ctc: 0, joining_date: new Date().toISOString().split('T')[0],
    gender: '', pan_number: '', bank_account: '', bank_name: '',
    official_address: '', corresponding_address: '',
  });

  // State for newly provisioned user account credentials
  const [newCredentials, setNewCredentials] = useState<{
    email: string;
    fullName: string;
    designation: string;
    tempPassword?: string;
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    // Required fields check
    if (!formData.full_name.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email address is required.");
      return;
    }
    
    // Email pattern check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.designation.trim()) {
      setError("Designation is required.");
      return;
    }
    if (formData.department_id === 0) {
      setError("Please select a department.");
      return;
    }
    if (formData.ctc <= 0) {
      setError("Annual CTC must be a positive number.");
      return;
    }
    if (!formData.joining_date) {
      setError("Joining Date is required.");
      return;
    }

    try {
      await api.createEmployee(formData);
      setError(null);
      setShowCreateModal(false);
      
      // Capture credentials info for displaying to the admin/manager
      setNewCredentials({
        email: formData.email,
        fullName: formData.full_name,
        designation: formData.designation,
        tempPassword: 'Welcome@123'
      });

      // Reset employee creation form data
      setFormData({
        full_name: '', email: '', phone: '', designation: '', department_id: 0,
        employment_type: 'full_time', ctc: 0, joining_date: new Date().toISOString().split('T')[0],
        gender: '', pan_number: '', bank_account: '', bank_name: '',
        official_address: '', corresponding_address: '',
      });

      fetchData();
    } catch (e: any) { setError(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            <Users size={28} strokeWidth={2} />
          </div>
          <h1 style={{ margin: 0 }}>Employee Directory</h1>
        </div>
        {isAdminOrHR && (
          <button className="btn btn-primary" onClick={() => { setError(null); setShowCreateModal(true); }}>+ Add Employee</button>
        )}
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total</div>
            <div className="stat-value">{employees.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Active</div>
            <div className="stat-value">{employees.filter(e => e.employment_status === 'active').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">On Notice</div>
            <div className="stat-value">{employees.filter(e => e.employment_status === 'on_notice').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Departments</div>
            <div className="stat-value">{departments.length}</div>
          </div>
        </div>
      </div>

      <div className="page-filters">
        <input className="filter-input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or employee ID..." style={{ width: 320 }} />
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
              <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/employees/${emp.id}`)}>
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
                <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{emp.employee_id}</td>
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
        <div className="modal-overlay" onClick={() => { setError(null); setShowCreateModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="modal-close" onClick={() => { setError(null); setShowCreateModal(false); }}>✕</button>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{
                  marginBottom: 16,
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
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Official Address</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: 60, fontFamily: 'inherit', resize: 'vertical' }} 
                  value={formData.official_address} 
                  onChange={e => setFormData({...formData, official_address: e.target.value})} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Correspondence Address</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: 60, fontFamily: 'inherit', resize: 'vertical' }} 
                  value={formData.corresponding_address} 
                  onChange={e => setFormData({...formData, corresponding_address: e.target.value})} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setError(null); setShowCreateModal(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Add Employee</button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Created Modal */}
      {newCredentials && (
        <div className="modal-overlay" onClick={() => setNewCredentials(null)}>
          <div className="modal-content" style={{ maxWidth: 450, textAlign: 'center', padding: '30px 24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <ShieldCheck size={36} />
              </div>
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: 8, fontWeight: 700, color: 'var(--text-primary)' }}>Account Provisioned!</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 24 }}>
              A secure user account has been successfully created for <strong>{newCredentials.fullName}</strong>. Please share these login details:
            </p>

            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>Username / Email</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-input)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <Mail size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden' }}>{newCredentials.email}</span>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px', minHeight: 'auto', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                    onClick={() => {
                      navigator.clipboard.writeText(newCredentials.email);
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    }}
                  >
                    {copiedEmail ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    {copiedEmail ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>Temporary Password</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-input)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Lock size={16} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>{newCredentials.tempPassword}</span>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px', minHeight: 'auto', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => {
                      navigator.clipboard.writeText(newCredentials.tempPassword || 'Welcome@123');
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 2000);
                    }}
                  >
                    {copiedPass ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    {copiedPass ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => {
                  const text = `HRM Account Created!\nName: ${newCredentials.fullName}\nUsername: ${newCredentials.email}\nPassword: ${newCredentials.tempPassword}\n\nLogin URL: ${window.location.origin}`;
                  navigator.clipboard.writeText(text);
                  setCopiedAll(true);
                  setTimeout(() => setCopiedAll(false), 2000);
                }}
              >
                {copiedAll ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                {copiedAll ? 'Copied Details' : 'Copy Details'}
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setNewCredentials(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
