'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useRole } from '@/lib/useRole';
import { 
  FileText, Clipboard, DollarSign, Award, LogOut, Lock, BookOpen, 
  UserSquare2, CreditCard, Landmark, Star, AlertTriangle, Folder, 
  Search, Upload, Download, Trash2, User, Paperclip
} from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'appointment_letter', label: 'Appointment Letter' },
  { value: 'salary_revision', label: 'Salary Revision' },
  { value: 'nda', label: 'NDA' },
  { value: 'policy', label: 'Policy' },
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'aadhar', label: 'Aadhar' },
  { value: 'bank_proof', label: 'Bank Proof' },
  { value: 'educational', label: 'Educational' },
  { value: 'payslip', label: 'Payslip' },
  { value: 'appraisal', label: 'Appraisal' },
  { value: 'experience_letter', label: 'Experience Letter' },
  { value: 'other', label: 'Other' },
];

const ICON_MAP: Record<string, any> = {
  offer_letter: FileText,
  appointment_letter: Clipboard,
  salary_revision: DollarSign,
  experience_letter: Award,
  relieving_letter: LogOut,
  nda: Lock,
  policy: BookOpen,
  id_proof: UserSquare2,
  address_proof: UserSquare2,
  educational: FileText,
  pan_card: CreditCard,
  aadhar: UserSquare2,
  bank_proof: Landmark,
  payslip: DollarSign,
  appraisal: Star,
  warning_letter: AlertTriangle,
  other: Folder,
};

export default function DocumentsPage() {
  const { isAdminOrHR } = useRole();
  const [docs, setDocs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: '', category: 'other', description: '', is_confidential: false, tags: '' });

  const fetchDocs = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const [d, s]: any = await Promise.all([
        api.getDocuments(params.toString()),
        api.getDocumentStats(),
      ]);
      setDocs(d);
      setStats(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, [search, category]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !form.title) { alert('Please select a file and enter a title.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', form.title);
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('is_confidential', String(form.is_confidential));
      fd.append('tags', form.tags);
      await api.uploadDocument(fd);
      setShowUpload(false);
      setForm({ title: '', category: 'other', description: '', is_confidential: false, tags: '' });
      if (fileRef.current) fileRef.current.value = '';
      fetchDocs();
    } catch (e: any) { alert(e.message); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Archive this document?')) return;
    await api.deleteDocument(id);
    fetchDocs();
  };

  const formatSize = (kb: number) => kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#6c63ff', display: 'flex', alignItems: 'center' }}>
            <Folder size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Document Management</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginTop: 4 }}>
              {stats?.total || 0} documents · {stats?.total_size_mb || 0} MB used
            </p>
          </div>
        </div>
        {isAdminOrHR && (
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Upload Document</button>
        )}
      </div>

      {/* Stats by category */}
      {stats?.by_category && Object.keys(stats.by_category).length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {Object.entries(stats.by_category).map(([k, v]: any) => {
            const CatIcon = ICON_MAP[k] || Folder;
            return (
              <div
                key={k}
                onClick={() => setCategory(category === k ? '' : k)}
                style={{
                  padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                  background: category === k ? 'var(--primary)' : 'var(--bg-card)',
                  border: `1px solid ${category === k ? 'var(--primary)' : 'var(--border)'}`,
                  color: category === k ? '#fff' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <CatIcon size={14} />
                <span>{v.label}</span>
                <span style={{ fontWeight: 700, fontSize: 11, opacity: 0.8 }}>({v.count})</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="page-filters">
        <input
          className="filter-input"
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
        {category && (
          <button className="btn btn-ghost btn-sm" onClick={() => setCategory('')}>✕ Clear filter</button>
        )}
      </div>

      {/* Documents Grid */}
      {docs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>
          <div style={{ color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Folder size={48} strokeWidth={1.5} />
          </div>
          <p>No documents found. {isAdminOrHR && 'Upload your first document.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {docs.map(doc => {
            const DocIcon = ICON_MAP[doc.category] || Folder;
            return (
              <div key={doc.id} className="card" style={{ position: 'relative' }}>
                {doc.is_confidential && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(239,68,68,0.15)', color: '#f87171',
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    display: 'inline-flex', alignItems: 'center', gap: 4
                  }}>
                    <Lock size={10} />
                    <span>CONFIDENTIAL</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: 'var(--bg-input)', display: 'flex', color: '#6c63ff',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <DocIcon size={20} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{doc.category_label}</div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={13} style={{ color: 'var(--text-tertiary)' }} />
                  <span>{doc.employee_name} · {doc.employee_code}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Paperclip size={13} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85%' }}>
                    {doc.file_name} · {formatSize(doc.file_size_kb)}
                  </span>
                </div>

                {doc.tags && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                    {doc.tags.split(',').map((t: string) => (
                      <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-input)', color: 'var(--text-tertiary)' }}>
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={api.downloadDocument(doc.id)}
                    target="_blank"
                    className="btn btn-sm btn-primary"
                    style={{ textDecoration: 'none', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                  {isAdminOrHR && (
                    <button className="btn btn-sm btn-secondary" onClick={() => handleDelete(doc.id)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Document</h2>
              <button className="modal-close" onClick={() => setShowUpload(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Offer Letter — Rahul Verma" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input className="form-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="onboarding, 2024" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">File * (PDF, Image, Word — max 10MB)</label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ color: 'var(--text-primary)' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_confidential} onChange={e => setForm({ ...form, is_confidential: e.target.checked })} />
                Mark as Confidential
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <Upload size={14} />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
