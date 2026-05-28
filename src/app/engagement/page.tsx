'use client';
import { useState, useEffect } from 'react';
import {
  HeartPulse, ClipboardList, MessageCircle, BarChart3, TrendingUp,
  SmilePlus, Frown, Meh, Smile, Laugh, Plus,
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';
const hdrs = () => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) } as Record<string, string>;
};

const MOODS = [
  { Icon: Frown, label: 'Terrible', value: 1, color: '#ef4444' },
  { Icon: Frown, label: 'Bad', value: 2, color: '#f97316' },
  { Icon: Meh, label: 'Okay', value: 3, color: '#f59e0b' },
  { Icon: Smile, label: 'Good', value: 4, color: '#22c55e' },
  { Icon: Laugh, label: 'Great', value: 5, color: '#10b981' },
];

export default function EngagementPage() {
  const [tab, setTab] = useState<'dashboard' | 'surveys' | 'mood'>('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [moodTrends, setMoodTrends] = useState<any>(null);
  const [selectedMood, setSelectedMood] = useState(0);
  const [moodNote, setMoodNote] = useState('');
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDesc, setSurveyDesc] = useState('');
  const [surveyQuestions, setSurveyQuestions] = useState([{ id: 1, text: '', type: 'rating' }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [d, s, m] = await Promise.all([
        fetch(`${API}/engagement/dashboard`, { headers: hdrs() }).then(r => r.json()),
        fetch(`${API}/engagement/surveys`, { headers: hdrs() }).then(r => r.json()),
        fetch(`${API}/engagement/mood/trends`, { headers: hdrs() }).then(r => r.json()),
      ]);
      setDashboard(d); setSurveys(s); setMoodTrends(m);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submitMood = async () => {
    if (!selectedMood) return;
    try {
      await fetch(`${API}/engagement/mood`, {
        method: 'POST', headers: hdrs(),
        body: JSON.stringify({ employee_id: 1, mood: selectedMood, note: moodNote || null }),
      });
      setSelectedMood(0); setMoodNote('');
      loadAll();
    } catch (e) { console.error(e); }
  };

  const createSurvey = async () => {
    try {
      await fetch(`${API}/engagement/surveys`, {
        method: 'POST', headers: hdrs(),
        body: JSON.stringify({ title: surveyTitle, description: surveyDesc, questions: surveyQuestions }),
      });
      setShowSurveyModal(false); setSurveyTitle(''); setSurveyDesc('');
      setSurveyQuestions([{ id: 1, text: '', type: 'rating' }]);
      loadAll();
    } catch (e) { console.error(e); }
  };

  const tabStyle = (t2: string) => ({
    padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 as const,
    background: tab === t2 ? '#6c63ff' : 'var(--bg-input)', color: tab === t2 ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s', fontFamily: 'Inter, sans-serif', display: 'flex' as const, alignItems: 'center' as const, gap: 6,
  });

  if (loading) return <div className="animate-fade-in" style={{ padding: 32 }}><p style={{ color: 'var(--text-secondary)' }}>Loading engagement data...</p></div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <HeartPulse size={20} strokeWidth={2} />
            </div>
            Employee Engagement
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Pulse surveys, mood tracking & wellness insights</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabStyle('dashboard')} onClick={() => setTab('dashboard')}><BarChart3 size={15} /> Dashboard</button>
        <button style={tabStyle('surveys')} onClick={() => setTab('surveys')}><ClipboardList size={15} /> Surveys</button>
        <button style={tabStyle('mood')} onClick={() => setTab('mood')}><SmilePlus size={15} /> Mood Tracking</button>
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && dashboard && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Active Surveys', value: dashboard.active_surveys, Icon: ClipboardList, color: '#6c63ff' },
              { label: 'Total Responses', value: dashboard.total_responses, Icon: MessageCircle, color: '#3b82f6' },
              { label: "Today's Avg Mood", value: dashboard.today_mood_avg || '—', Icon: SmilePlus, color: '#10b981' },
              { label: 'Mood Check-ins', value: dashboard.today_mood_count, Icon: TrendingUp, color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                    <s.Icon size={22} strokeWidth={1.8} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {moodTrends && moodTrends.trends && moodTrends.trends.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} style={{ color: '#6c63ff' }} /> Mood Trends (Last 30 Days)</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
                {moodTrends.trends.slice(-30).map((t: any, i: number) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{t.avg_mood}</div>
                    <div style={{ width: '100%', height: `${(t.avg_mood / 5) * 100}%`, borderRadius: 4,
                      background: t.avg_mood >= 4 ? '#10b981' : t.avg_mood >= 3 ? '#f59e0b' : '#ef4444',
                      minHeight: 4, transition: 'height 0.3s' }} />
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
                Overall Average: <strong style={{ color: moodTrends.overall_avg >= 4 ? '#10b981' : moodTrends.overall_avg >= 3 ? '#f59e0b' : '#ef4444' }}>{moodTrends.overall_avg}/5</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Surveys Tab */}
      {tab === 'surveys' && (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowSurveyModal(true)}>
              <Plus size={16} /> Create Survey
            </button>
          </div>
          {surveys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#6c63ff' }}>
                <ClipboardList size={28} strokeWidth={1.5} />
              </div>
              <h3>No Surveys Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Create your first pulse survey to gather employee feedback</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {surveys.map(s => (
                <div key={s.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.description || 'No description'} · {(s.questions || []).length} questions</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: s.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                      color: s.status === 'active' ? '#10b981' : '#6b7280' }}>{s.status.toUpperCase()}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MessageCircle size={13} /> {s.response_count} responses
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mood Tracking Tab */}
      {tab === 'mood' && (
        <div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', textAlign: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 8px' }}>How are you feeling today?</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px', fontSize: 14 }}>Your response is anonymous and helps us improve the workplace</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
              {MOODS.map(m => {
                const MIcon = m.Icon;
                return (
                  <button key={m.value} onClick={() => setSelectedMood(m.value)} style={{
                    width: 72, height: 72, borderRadius: 16, border: selectedMood === m.value ? `3px solid ${m.color}` : '2px solid var(--border)',
                    background: selectedMood === m.value ? `${m.color}22` : 'var(--bg-input)', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    transition: 'all 0.2s', transform: selectedMood === m.value ? 'scale(1.1)' : 'scale(1)',
                  }}>
                    <MIcon size={26} style={{ color: selectedMood === m.value ? m.color : 'var(--text-secondary)' }} strokeWidth={1.8} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: selectedMood === m.value ? m.color : 'var(--text-secondary)' }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
            <input className="form-input" placeholder="Add a note (optional)" value={moodNote} onChange={e => setMoodNote(e.target.value)}
              style={{ maxWidth: 400, margin: '0 auto 16px', display: 'block' }} />
            <button className="btn btn-primary" onClick={submitMood} disabled={!selectedMood}>Submit Mood</button>
          </div>
        </div>
      )}

      {/* Create Survey Modal */}
      {showSurveyModal && (
        <div className="modal-overlay" onClick={() => setShowSurveyModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h2 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={20} style={{ color: '#6c63ff' }} /> Create Pulse Survey
            </h2>
            <div className="form-group">
              <label className="form-label">Survey Title</label>
              <input className="form-input" value={surveyTitle} onChange={e => setSurveyTitle(e.target.value)} placeholder="e.g. Q2 Employee Satisfaction" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={surveyDesc} onChange={e => setSurveyDesc(e.target.value)} placeholder="Brief description" />
            </div>
            <div className="form-group">
              <label className="form-label">Questions</label>
              {surveyQuestions.map((q, i) => (
                <div key={q.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="form-input" value={q.text} placeholder={`Question ${i + 1}`} style={{ flex: 1 }}
                    onChange={e => setSurveyQuestions(qs => qs.map((qq, j) => j === i ? { ...qq, text: e.target.value } : qq))} />
                  <select className="form-input" value={q.type} style={{ width: 100 }}
                    onChange={e => setSurveyQuestions(qs => qs.map((qq, j) => j === i ? { ...qq, type: e.target.value } : qq))}>
                    <option value="rating">Rating</option><option value="text">Text</option><option value="choice">Choice</option>
                  </select>
                </div>
              ))}
              <button className="btn btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => setSurveyQuestions(qs => [...qs, { id: qs.length + 1, text: '', type: 'rating' }])}><Plus size={14} /> Add Question</button>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowSurveyModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createSurvey} disabled={!surveyTitle}>Create Survey</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
