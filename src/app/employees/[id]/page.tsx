'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Employee } from '@/types';
import { formatCurrency, formatDate, getStatusBadgeClass, getInitials } from '@/lib/utils';
import { 
  ArrowLeft, User, Edit2, Info, Palmtree, Calendar, 
  PartyPopper, Star, Pin
} from 'lucide-react';

const TIMELINE_ICONS: Record<string, any> = {
  joining: PartyPopper,
  leave: Palmtree,
  review: Star,
  default: Pin,
};

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [emp, tl, depts]: any = await Promise.all([
          api.getEmployee(Number(id)),
          api.getEmployeeTimeline(Number(id)),
          api.getDepartments(),
        ]);
        setEmployee(emp);
        setTimeline(Array.isArray(tl) ? tl : []);
        setDepartments(depts as any[]);
        setEditData({
          full_name: emp.full_name,
          phone: emp.phone || '',
          designation: emp.designation || '',
          department_id: emp.department_id || 0,
          employment_type: emp.employment_type,
          employment_status: emp.employment_status,
          ctc: emp.ctc,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAll();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated: any = await api.updateEmployee(Number(id), editData);
      setEmployee(updated);
      setShowEditModal(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;
  if (!employee) return <div className="loading-page"><p>Employee not found.</p></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ color: '#6c63ff', display: 'flex', alignItems: 'center' }}>
              <User size={24} />
            </div>
            <h1 style={{ margin: 0 }}>Employee Profile</h1>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowEditModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Edit2 size={14} />
          <span>Edit</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div className="user-avatar" style={{ width: 72, height: 72, fontSize: 24 }}>
            {getInitials(employee.full_name)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{employee.full_name}</h2>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 14, marginBottom: 8 }}>
              {employee.designation} · {employee.department_name}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontSize: 13 }}>{employee.employee_id}</span>
              <span className={`badge ${getStatusBadgeClass(employee.employment_status)}`}>{employee.employment_status.replace('_', ' ')}</span>
              <span className="badge badge-info">{employee.employment_type.replace('_', ' ')}</span>
              <span className="badge badge-neutral">{employee.onboarding_status}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(employee.ctc)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Annual CTC</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Personal Info */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={16} style={{ color: '#6c63ff' }} />
            <span>Personal Info</span>
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              ['Email', employee.email],
              ['Phone', employee.phone || '—'],
              ['Gender', employee.gender || '—'],
              ['Date of Birth', employee.date_of_birth ? formatDate(employee.date_of_birth) : '—'],
              ['Joining Date', formatDate(employee.joining_date)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Balances */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palmtree size={16} style={{ color: '#6c63ff' }} />
            <span>Leave Balances</span>
          </h3>
          <div style={{ display: 'grid', gap: 16 }}>
            {[
              ['Casual Leave', employee.casual_leave_balance, 12, 'var(--accent-blue)'],
              ['Sick Leave', employee.sick_leave_balance, 12, 'var(--accent-orange)'],
              ['Earned Leave', employee.earned_leave_balance, 15, 'var(--accent-green)'],
            ].map(([label, used, total, color]: any) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color }}>{used} / {total} days</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(used / total) * 100}%`, background: color, borderRadius: 3 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} style={{ color: '#6c63ff' }} />
          <span>Activity Timeline</span>
        </h3>
        {timeline.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>No timeline events yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timeline.map((event, i) => {
              const EventIcon = TIMELINE_ICONS[event.type] || TIMELINE_ICONS.default;
              return (
                <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 20, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c63ff', flexShrink: 0 }}>
                      <EventIcon size={16} />
                    </div>
                    {i < timeline.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4 }}></div>
                    )}
                  </div>
                  <div style={{ paddingTop: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{event.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{event.detail}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{formatDate(event.date)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Employee</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input className="form-input" value={editData.designation} onChange={e => setEditData({ ...editData, designation: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={editData.department_id} onChange={e => setEditData({ ...editData, department_id: +e.target.value })}>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Annual CTC (₹)</label>
                  <input className="form-input" type="number" value={editData.ctc} onChange={e => setEditData({ ...editData, ctc: +e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={editData.employment_status} onChange={e => setEditData({ ...editData, employment_status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="on_notice">On Notice</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
