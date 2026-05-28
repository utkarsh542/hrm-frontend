'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRole } from '@/lib/useRole';
import {
  CalendarDays, GraduationCap, PartyPopper, Briefcase,
  Palmtree, Folder, Plus, Loader2, Send, Trash2,
  Clock, MapPin, ExternalLink, HelpCircle, AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const CATEGORIES = [
  { value: '', label: 'All Activities', Icon: CalendarDays, color: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
  { value: 'training', label: 'Training', Icon: GraduationCap, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { value: 'event', label: 'Company Events', Icon: CalendarDays, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'team_building', label: 'Team Building', Icon: PartyPopper, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'meeting', label: 'Meetings', Icon: Briefcase, color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  { value: 'holiday', label: 'Holidays', Icon: Palmtree, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
  { value: 'other', label: 'Other', Icon: Folder, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
];

export default function ActivitiesPage() {
  const { isAdminHROrManager } = useRole();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    category: 'event',
    description: '',
    scheduled_at: '',
    location: ''
  });

  const fetchActivities = async () => {
    try {
      const data = await api.getActivities(selectedCat || undefined);
      setActivities(data);
    } catch (e) {
      console.error("Error fetching activities:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedCat]);

  const handleCreate = async () => {
    setError(null);
    if (!form.title || !form.title.trim() || !form.scheduled_at) {
      setError("Please fill in all required fields (Title & Date/Time).");
      return;
    }
    setSaving(true);
    try {
      await api.createActivity({
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        location: form.location || undefined
      });
      setError(null);
      setShowModal(false);
      setForm({ title: '', category: 'event', description: '', scheduled_at: '', location: '' });
      fetchActivities();
    } catch (e: any) {
      setError("Error planning activity: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this planned activity?")) return;
    setError(null);
    try {
      await api.deleteActivity(id);
      fetchActivities();
    } catch (e: any) {
      setError("Error deleting activity: " + e.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const getCatConfig = (catName: string) => {
    return CATEGORIES.find(c => c.value === catName) || CATEGORIES[6];
  };

  const formatActivityTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#6c63ff', display: 'flex', alignItems: 'center' }}>
            <CalendarDays size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Corporate Activities</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              Plan corporate gatherings, bootcamps, town halls, and holidays.
            </p>
          </div>
        </div>
        {isAdminHROrManager && (
          <button 
            className="btn btn-primary" 
            onClick={() => { setError(null); setShowModal(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Plan Corporate Activity
          </button>
        )}
      </div>

      {error && !showModal && (
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

      {/* Categories Filter list */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {CATEGORIES.map(cat => {
          const CatIcon = cat.Icon;
          const isActive = selectedCat === cat.value;
          return (
            <div
              key={cat.value}
              onClick={() => setSelectedCat(cat.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 24,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                background: isActive ? cat.color : 'var(--bg-card)',
                border: `1.5px solid ${isActive ? cat.color : 'var(--border)'}`,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease-in-out',
                boxShadow: isActive ? `0 4px 12px ${cat.color}44` : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.borderColor = cat.color;
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <CatIcon size={14} style={{ color: isActive ? '#ffffff' : cat.color }} />
              <span>{cat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Activities Timeline / Cards Grid */}
      {activities.length === 0 ? (
        <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '64px 32px', color: 'var(--text-tertiary)', border: '1px dashed var(--border)' }}>
          <div style={{ color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <CalendarDays size={52} strokeWidth={1.5} />
          </div>
          <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>No Scheduled Activities</h3>
          <p style={{ margin: 0, fontSize: 14 }}>
            There are no upcoming company activities scheduled under this category.
            {isAdminHROrManager && " Get started by scheduling the first activity!"}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {activities.map(act => {
            const catCfg = getCatConfig(act.category);
            const CatIcon = catCfg.Icon;
            
            const isUrl = act.location && (act.location.startsWith('http://') || act.location.startsWith('https://'));
            
            return (
              <div 
                key={act.id} 
                className="card animate-fade-in" 
                style={{ 
                  position: 'relative', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  border: `1.5px solid ${catCfg.color}25`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(255,255,255,0.01) 100%)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  {/* Category Pill Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 800, 
                      padding: '4px 10px', 
                      borderRadius: 12, 
                      background: catCfg.bg, 
                      color: catCfg.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <CatIcon size={10} />
                      {catCfg.label.toUpperCase()}
                    </span>
                    {isAdminHROrManager && (
                      <button 
                        onClick={() => handleDelete(act.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#f87171', 
                          cursor: 'pointer',
                          padding: 4, 
                          borderRadius: 6, 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        title="Cancel Event"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{act.title}</h3>
                  {act.description && (
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {act.description}
                    </p>
                  )}
                </div>

                {/* Footer specs */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    <Clock size={12} style={{ color: catCfg.color }} />
                    <span>{formatActivityTime(act.scheduled_at)}</span>
                  </div>
                  {act.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <MapPin size={12} style={{ color: catCfg.color }} />
                      {isUrl ? (
                        <a 
                          href={act.location} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: '#6c63ff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                          Join Online Meeting <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span>{act.location}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Activity Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setError(null); setShowModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Plan Corporate Activity</h2>
              <button className="modal-close" onClick={() => { setError(null); setShowModal(false); }}>✕</button>
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
                <label className="form-label">Activity Title *</label>
                <input 
                  className="form-input" 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  placeholder="e.g. Employee Engagement Town Hall" 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select" 
                    value={form.category} 
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.filter(c => c.value).map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Scheduled Date & Time *</label>
                  <input 
                    className="form-input" 
                    type="datetime-local" 
                    value={form.scheduled_at} 
                    onChange={e => setForm({ ...form, scheduled_at: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location or Meeting Link (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                    <MapPin size={14} />
                  </span>
                  <input 
                    className="form-input" 
                    value={form.location} 
                    onChange={e => setForm({ ...form, location: e.target.value })} 
                    placeholder="e.g. Conference Room A, or https://meet.google.com/..." 
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Agenda</label>
                <textarea 
                  className="form-textarea" 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  placeholder="Describe the activity, agenda points, or training outcomes..." 
                  rows={3} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setError(null); setShowModal(false); }} disabled={saving}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleCreate} 
                disabled={saving || !form.title || !form.scheduled_at} 
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span>{saving ? 'Scheduling...' : 'Plan Activity'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
