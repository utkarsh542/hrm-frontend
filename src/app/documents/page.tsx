'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useRole } from '@/lib/useRole';
import { 
  FileText, Clipboard, DollarSign, Award, LogOut, Lock, BookOpen, 
  UserSquare2, CreditCard, Landmark, Star, AlertTriangle, Folder, 
  Search, Upload, Download, Trash2, User, Paperclip, Sparkles,
  Bot, Send, Loader2, ChevronDown, ChevronUp, HelpCircle
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
  const { isAdminOrHR, email } = useRole();
  const [currentEmp, setCurrentEmp] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: '', category: 'other', description: '', is_confidential: false, tags: '' });

  // RAG States
  const [ragQuery, setRagQuery] = useState('');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResult, setRagResult] = useState<any>(null);

  const handleRagSearch = async () => {
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    setRagResult(null);
    try {
      const res = await api.queryDocs(ragQuery);
      setRagResult(res);
    } catch (e: any) {
      alert("Error querying documents: " + e.message);
    } finally {
      setRagLoading(false);
    }
  };

  const fetchDocs = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      
      const promises: any[] = [
        api.getDocuments(params.toString()),
        api.getDocumentStats(),
      ];
      
      if (!currentEmp) {
        promises.push(api.getEmployees());
      }
      
      const results = await Promise.all(promises);
      setDocs(results[0]);
      setStats(results[1]);
      
      if (results[2]) {
        const emps = results[2];
        const matched = emps.find((e: any) => e.email === email);
        if (matched) setCurrentEmp(matched);
      }
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
          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            <Folder size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Document Management</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginTop: 4 }}>
              {stats?.total || 0} documents · {stats?.total_size_mb || 0} MB used
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Upload Document</button>
      </div>

      {/* 🔮 Interactive "Ask HR Policies / Query Docs" RAG Panel */}
      <div 
        className="card animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(16,185,129,0.02) 100%)',
          border: '1px solid rgba(37,99,235,0.2)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          boxShadow: '0 8px 32px 0 rgba(37,99,235,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'rgba(37,99,235,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            flexShrink: 0
          }}>
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              Ask HR Policies & Corporate Docs
              <span style={{ fontSize: 10, background: 'rgba(37,99,235,0.2)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>AI RAG ENGINE</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
              Query policy manuals, handbooks, and documents with instant, cited answers.
            </p>
          </div>
        </div>

        <div className="responsive-flex" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
              <HelpCircle size={16} />
            </span>
            <input
              type="text"
              className="filter-input"
              value={ragQuery}
              onChange={e => setRagQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRagSearch()}
              placeholder="Ask a policy question... (e.g., 'What is our leave rollover policy?')"
              style={{
                width: '100%',
                paddingLeft: 38,
                paddingRight: 14,
                height: 44,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            />
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleRagSearch}
            disabled={ragLoading || !ragQuery.trim()}
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            {ragLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span>{ragLoading ? 'Searching...' : 'Ask AI'}</span>
          </button>
        </div>

        {/* Loading Indicator */}
        {ragLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={16} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Scanning documents and generating answer...</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
              <div className="progress-bar-fill" style={{ width: '60%', height: '100%', background: 'var(--primary)', borderRadius: 3, animation: 'pulse 1.5s infinite ease-in-out' }}></div>
            </div>
          </div>
        )}

        {/* RAG Answer Display */}
        {ragResult && (
          <div 
            className="animate-fade-in"
            style={{
              marginTop: 20,
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: 'var(--primary)', fontSize: 13, fontWeight: 700 }}>
              <Bot size={16} />
              <span>AI-GENERATED ANSWER</span>
            </div>
            <p 
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {ragResult.answer}
            </p>

            {/* References */}
            {ragResult.references && ragResult.references.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  CITATIONS & REFERENCED DOCUMENT SNIPPETS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ragResult.references.map((ref: any, idx: number) => (
                    <div 
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, background: 'rgba(37,99,235,0.15)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {ref.title}
                        </span>
                        {ref.file_name && (
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            ({ref.file_name})
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{ref.snippet}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
          className="filter-input filter-input-search"
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
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
          <p>No documents found. Upload your first document.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
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
                    background: 'var(--bg-input)', display: 'flex', color: 'var(--primary)',
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
                  {(isAdminOrHR || (currentEmp && doc.employee_id === currentEmp.id)) && (
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
