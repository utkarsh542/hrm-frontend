'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRole } from '@/lib/useRole';
import { formatCurrency, formatDate } from '@/lib/utils';

import { 
  CreditCard, Clock, CheckCircle2, DollarSign, BarChart2, Check, X,
  Plane, Utensils, Hotel, Laptop, BookOpen, HeartPulse, Globe, Smartphone, Folder, AlertCircle
} from 'lucide-react';

const CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food & Meals' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'training', label: 'Training' },
  { value: 'medical', label: 'Medical' },
  { value: 'internet', label: 'Internet' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'other', label: 'Other' },
];

const ICON_MAP: Record<string, any> = {
  travel: Plane,
  food: Utensils,
  accommodation: Hotel,
  equipment: Laptop,
  training: BookOpen,
  medical: HeartPulse,
  internet: Globe,
  mobile: Smartphone,
  other: Folder,
};

const STAT_ICONS: Record<string, any> = {
  Pending: Clock,
  Approved: CheckCircle2,
  Paid: DollarSign,
  Total: BarChart2,
};

const STATUS_BADGE: Record<string, string> = {
  submitted: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
  paid: 'badge-primary',
  draft: 'badge-neutral',
};

export default function ExpensesPage() {
  const { isAdminOrHR, isAdminHROrManager } = useRole();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    employee_id: 1, title: '', category: 'travel',
    amount: '', expense_date: new Date().toISOString().split('T')[0], description: '',
  });

  const fetchAll = async () => {
    try {
      const params = statusFilter ? `status=${statusFilter}` : '';
      const [e, s]: any = await Promise.all([api.getExpenses(params), api.getExpenseStats()]);
      setExpenses(e);
      setStats(s);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [statusFilter]);

  const handleCreate = async () => {
    setError(null);
    if (!form.title || !form.title.trim() || !form.amount) { 
      setError('Title and amount are required.'); 
      return; 
    }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Expense amount must be a positive number.');
      return;
    }
    setSaving(true);
    try {
      await api.createExpense({ ...form, amount: parseFloat(form.amount) });
      setError(null);
      setShowCreate(false);
      setForm({ employee_id: 1, title: '', category: 'travel', amount: '', expense_date: new Date().toISOString().split('T')[0], description: '' });
      fetchAll();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleAction = async (id: number, action: string, approvedBy = 1) => {
    setError(null);
    try {
      await api.actionExpense(id, { action, approved_by: approvedBy });
      fetchAll();
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            <CreditCard size={28} strokeWidth={2} />
          </div>
          <h1 style={{ margin: 0 }}>Expense Management</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(null); setShowCreate(true); }}>+ Submit Expense</button>
      </div>

      {error && !showCreate && (
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

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Pending', value: stats?.pending || 0, sub: formatCurrency(stats?.pending_amount || 0), color: 'orange' },
          { label: 'Approved', value: stats?.approved || 0, sub: formatCurrency(stats?.approved_amount || 0), color: 'green' },
          { label: 'Paid', value: stats?.paid || 0, sub: formatCurrency(stats?.paid_amount || 0), color: 'blue' },
          { label: 'Total', value: stats?.total || 0, sub: 'all time', color: 'purple' },
        ].map(s => {
          const IconComp = STAT_ICONS[s.label] || BarChart2;
          return (
            <div key={s.label} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter(s.label.toLowerCase() === 'total' ? '' : s.label.toLowerCase() === 'pending' ? 'submitted' : s.label.toLowerCase())}>
              <div className={`stat-icon ${s.color}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconComp size={18} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-change">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="page-filters">
        {['', 'submitted', 'approved', 'rejected', 'paid'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              {isAdminHROrManager && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => {
              const ExpIcon = ICON_MAP[exp.category] || Folder;
              return (
                <tr key={exp.id}>
                  <td style={{ fontWeight: 600 }}>{exp.employee_name}</td>
                  <td>{exp.title}</td>
                  <td>
                    <span style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ExpIcon size={14} style={{ color: 'var(--text-tertiary)' }} />
                      <span>{exp.category_label}</span>
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(exp.amount)}</td>
                  <td>{formatDate(exp.expense_date)}</td>
                  <td><span className={`badge ${STATUS_BADGE[exp.status] || 'badge-neutral'}`}>{exp.status}</span></td>
                  {isAdminHROrManager && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {exp.status === 'submitted' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => handleAction(exp.id, 'approve')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={() => handleAction(exp.id, 'reject')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {exp.status === 'approved' && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleAction(exp.id, 'pay')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <DollarSign size={12} />
                            <span>Mark Paid</span>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {expenses.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>No expenses found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => { setError(null); setShowCreate(false); }}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Expense</h2>
              <button className="modal-close" onClick={() => { setError(null); setShowCreate(false); }}>✕</button>
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
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Client dinner — Bangalore" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Expense Date</label>
                <input className="form-input" type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setError(null); setShowCreate(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Submitting...' : 'Submit Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
