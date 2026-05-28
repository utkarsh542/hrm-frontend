'use client';
import { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, History, Palmtree, CreditCard, DoorOpen,
  FileText, Check, X, PartyPopper,
} from 'lucide-react';

import { API_BASE } from '@/lib/api';

const API = API_BASE;
const hdrs = () => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) } as Record<string, string>;
};

export default function ApprovalsPage() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ id: number; action: string } | null>(null);
  const [comments, setComments] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [p, h] = await Promise.all([
        fetch(`${API}/workflows/pending`, { headers: hdrs() }).then(r => r.json()),
        fetch(`${API}/workflows/history`, { headers: hdrs() }).then(r => r.json()),
      ]);
      setPending(p); setHistory(h);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      await fetch(`${API}/workflows/${actionModal.id}/approve`, {
        method: 'POST', headers: hdrs(),
        body: JSON.stringify({ action: actionModal.action, comments }),
      });
      setActionModal(null); setComments('');
      loadData();
    } catch (e) { console.error(e); }
  };

  const typeConfig: Record<string, { bg: string; color: string; Icon: any }> = {
    leave: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', Icon: Palmtree },
    expense: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', Icon: CreditCard },
    resignation: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', Icon: DoorOpen },
    document: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', Icon: FileText },
  };

  const tabStyle = (t2: string) => ({
    padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 as const,
    background: tab === t2 ? '#6c63ff' : 'var(--bg-input)', color: tab === t2 ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s', fontFamily: 'Inter, sans-serif', display: 'flex' as const, alignItems: 'center' as const, gap: 6,
  });

  if (loading) return <div className="animate-fade-in" style={{ padding: 32 }}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle2 size={20} strokeWidth={2} />
          </div>
          Approval Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Manage all pending approvals in one place</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Pending Approvals</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{pending.length}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Clock size={22} strokeWidth={1.8} />
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Processed This Month</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>{history.length}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle2 size={22} strokeWidth={1.8} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={tabStyle('pending')} onClick={() => setTab('pending')}><Clock size={15} /> Pending ({pending.length})</button>
        <button style={tabStyle('history')} onClick={() => setTab('history')}><History size={15} /> History</button>
      </div>

      {tab === 'pending' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981' }}>
                <PartyPopper size={28} strokeWidth={1.5} />
              </div>
              <h3>All Clear!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>No pending approvals. Great job keeping things moving!</p>
            </div>
          ) : pending.map(a => {
            const tc = typeConfig[a.entity_type] || typeConfig.document;
            const TIcon = tc.Icon;
            return (
              <div key={a.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tc.color }}>
                    <TIcon size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.description || `${a.entity_type} request`}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 700 }}>{a.entity_type.toUpperCase()}</span>
                  <button className="btn btn-success" style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setActionModal({ id: a.id, action: 'approve' })}>
                    <Check size={14} /> Approve
                  </button>
                  <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setActionModal({ id: a.id, action: 'reject' })}>
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'history' && (
        <div className="data-table" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <table>
            <thead><tr><th>Request</th><th>Type</th><th>Status</th><th>Comments</th><th>Date</th></tr></thead>
            <tbody>
              {history.map(a => {
                const tc = typeConfig[a.entity_type] || typeConfig.document;
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.title}</td>
                    <td><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: tc.bg, color: tc.color }}>{a.entity_type}</span></td>
                    <td><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: a.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: a.status === 'approved' ? '#10b981' : '#ef4444' }}>{a.status.toUpperCase()}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{a.comments || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.acted_at ? new Date(a.acted_at).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                );
              })}
              {history.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No history yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {actionModal.action === 'approve'
                ? <><Check size={20} style={{ color: '#10b981' }} /> Approve Request</>
                : <><X size={20} style={{ color: '#ef4444' }} /> Reject Request</>}
            </h2>
            <div className="form-group">
              <label className="form-label">Comments (optional)</label>
              <textarea className="form-input" value={comments} onChange={e => setComments(e.target.value)} rows={3} placeholder="Add a comment..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setActionModal(null)}>Cancel</button>
              <button className={`btn ${actionModal.action === 'approve' ? 'btn-success' : 'btn-danger'}`} onClick={handleAction} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {actionModal.action === 'approve' ? <><Check size={14} /> Confirm Approve</> : <><X size={14} /> Confirm Reject</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
