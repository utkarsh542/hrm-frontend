'use client';
import { useState, useEffect } from 'react';
import {
  Brain, Target, BookOpen, Crown, Plus, Users, MapPin,
  Award, Shield, Zap, GraduationCap, Building2,
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';
const hdrs = () => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) } as Record<string, string>;
};

export default function SkillsPage() {
  const [tab, setTab] = useState<'skills' | 'training' | 'succession'>('skills');
  const [skills, setSkills] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [succPlans, setSuccPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showSuccModal, setShowSuccModal] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', category: 'technical', description: '' });
  const [newProgram, setNewProgram] = useState({ title: '', description: '', category: '', provider: '', duration_hours: 0, is_mandatory: false });
  const [newPlan, setNewPlan] = useState({ position: '', department: '', criticality: 'medium' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [s, m, p, sp] = await Promise.all([
        fetch(`${API}/skills/`, { headers: hdrs() }).then(r => r.json()),
        fetch(`${API}/skills/matrix`, { headers: hdrs() }).then(r => r.json()),
        fetch(`${API}/skills/training/programs`, { headers: hdrs() }).then(r => r.json()),
        fetch(`${API}/skills/succession/plans`, { headers: hdrs() }).then(r => r.json()),
      ]);
      setSkills(s); setMatrix(m); setPrograms(p); setSuccPlans(sp);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createSkill = async () => {
    await fetch(`${API}/skills/`, { method: 'POST', headers: hdrs(), body: JSON.stringify(newSkill) });
    setShowSkillModal(false); setNewSkill({ name: '', category: 'technical', description: '' }); loadAll();
  };
  const createProgram = async () => {
    await fetch(`${API}/skills/training/programs`, { method: 'POST', headers: hdrs(), body: JSON.stringify(newProgram) });
    setShowTrainingModal(false); setNewProgram({ title: '', description: '', category: '', provider: '', duration_hours: 0, is_mandatory: false }); loadAll();
  };
  const createSuccPlan = async () => {
    await fetch(`${API}/skills/succession/plans`, { method: 'POST', headers: hdrs(), body: JSON.stringify(newPlan) });
    setShowSuccModal(false); setNewPlan({ position: '', department: '', criticality: 'medium' }); loadAll();
  };

  const tabStyle = (t2: string) => ({
    padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 as const,
    background: tab === t2 ? 'var(--primary)' : 'var(--bg-input)', color: tab === t2 ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s', fontFamily: 'Inter, sans-serif', display: 'flex' as const, alignItems: 'center' as const, gap: 6,
  });

  const catColors: Record<string, string> = { technical: '#3b82f6', soft: '#8b5cf6', domain: '#10b981', certification: '#f59e0b', language: '#ef4444' };

  if (loading) return <div className="animate-fade-in" style={{ padding: 32 }}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <Brain size={20} strokeWidth={2} />
            </div>
            Skills & Development
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Skills matrix, training programs & succession planning</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabStyle('skills')} onClick={() => setTab('skills')}><Target size={15} /> Skills Matrix</button>
        <button style={tabStyle('training')} onClick={() => setTab('training')}><BookOpen size={15} /> Training</button>
        <button style={tabStyle('succession')} onClick={() => setTab('succession')}><Crown size={15} /> Succession</button>
      </div>

      {/* Skills Tab */}
      {tab === 'skills' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{skills.length} skills tracked across {matrix.length} departments</div>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowSkillModal(true)}>
              <Plus size={16} /> Add Skill
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            {skills.map(s => (
              <div key={s.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: `${catColors[s.category] || '#6b7280'}22`, color: catColors[s.category] || '#6b7280' }}>{s.category}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={12} /> {s.employee_count} employees
                </div>
              </div>
            ))}
          </div>

          {matrix.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', overflowX: 'auto' }}>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={18} style={{ color: 'var(--primary)' }} /> Department Skills Heatmap</h3>
              {matrix.filter(d => Object.keys(d.skills).length > 0).map(dept => (
                <div key={dept.department_id} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{dept.department} <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-secondary)' }}>({dept.employee_count} employees)</span></div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(dept.skills).map(([name, data]: [string, any]) => {
                      const intensity = Math.min(data.avg_proficiency / 5, 1);
                      return (
                        <div key={name} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: `rgba(37,99,235,${0.1 + intensity * 0.4})`, color: intensity > 0.5 ? '#fff' : '#c4b5fd',
                          border: '1px solid rgba(37,99,235,0.3)' }}>
                          {name} <span style={{ opacity: 0.8 }}>({data.avg_proficiency}/5)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Training Tab */}
      {tab === 'training' && (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowTrainingModal(true)}>
              <Plus size={16} /> Create Program
            </button>
          </div>
          {programs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#8b5cf6' }}>
                <GraduationCap size={28} strokeWidth={1.5} />
              </div>
              <h3>No Training Programs</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Create training programs to upskill your workforce</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {programs.map(p => (
                <div key={p.id} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{p.title}</span>
                    {p.is_mandatory && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}><Shield size={10} /> MANDATORY</span>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>{p.description || 'No description'}</p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {p.provider && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Building2 size={12} /> {p.provider}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Zap size={12} /> {p.duration_hours}h</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={12} /> {p.enrolled_count} enrolled</span>
                  </div>
                  {p.skills_covered && p.skills_covered.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                      {p.skills_covered.map((s: string) => (
                        <span key={s} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: 'rgba(37,99,235,0.15)', color: 'var(--primary)' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Succession Tab */}
      {tab === 'succession' && (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowSuccModal(true)}>
              <Plus size={16} /> Create Succession Plan
            </button>
          </div>
          {succPlans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f59e0b' }}>
                <Crown size={28} strokeWidth={1.5} />
              </div>
              <h3>No Succession Plans</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Create succession plans for key positions</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {succPlans.map(p => {
                const critColors: Record<string, { bg: string; color: string }> = {
                  high: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
                  medium: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
                  low: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
                };
                const cc = critColors[p.criticality] || critColors.medium;
                return (
                  <div key={p.id} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{p.position}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.department} {p.current_holder ? `· Current: ${p.current_holder}` : ''}</div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cc.bg, color: cc.color, height: 'fit-content' }}>{p.criticality.toUpperCase()}</span>
                    </div>
                    {p.candidates.length > 0 ? (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {p.candidates.map((c: any) => (
                          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                            <div>
                              <span style={{ fontWeight: 600 }}>{c.employee_name}</span>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>{c.designation}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                background: c.readiness === 'ready_now' ? 'rgba(16,185,129,0.15)' : c.readiness === '1-2_years' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                color: c.readiness === 'ready_now' ? '#10b981' : c.readiness === '1-2_years' ? '#f59e0b' : '#ef4444' }}>{c.readiness.replace(/_/g, ' ')}</span>
                              {c.ai_score && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}><Award size={12} /> {c.ai_score}%</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>No candidates assessed yet</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Skill Modal */}
      {showSkillModal && (
        <div className="modal-overlay" onClick={() => setShowSkillModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Target size={20} style={{ color: 'var(--primary)' }} /> Add Skill</h2>
            <div className="form-group"><label className="form-label">Skill Name</label>
              <input className="form-input" value={newSkill.name} onChange={e => setNewSkill({ ...newSkill, name: e.target.value })} placeholder="e.g. Python" /></div>
            <div className="form-group"><label className="form-label">Category</label>
              <select className="form-input" value={newSkill.category} onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}>
                <option value="technical">Technical</option><option value="soft">Soft Skill</option>
                <option value="domain">Domain</option><option value="certification">Certification</option><option value="language">Language</option>
              </select></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowSkillModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createSkill} disabled={!newSkill.name}>Add Skill</button>
            </div>
          </div>
        </div>
      )}

      {/* Training Modal */}
      {showTrainingModal && (
        <div className="modal-overlay" onClick={() => setShowTrainingModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={20} style={{ color: 'var(--primary)' }} /> Create Training Program</h2>
            <div className="form-group"><label className="form-label">Title</label>
              <input className="form-input" value={newProgram.title} onChange={e => setNewProgram({ ...newProgram, title: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Provider</label>
              <input className="form-input" value={newProgram.provider} onChange={e => setNewProgram({ ...newProgram, provider: e.target.value })} placeholder="e.g. Coursera" /></div>
            <div className="form-group"><label className="form-label">Duration (hours)</label>
              <input className="form-input" type="number" value={newProgram.duration_hours} onChange={e => setNewProgram({ ...newProgram, duration_hours: Number(e.target.value) })} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowTrainingModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createProgram} disabled={!newProgram.title}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Succession Modal */}
      {showSuccModal && (
        <div className="modal-overlay" onClick={() => setShowSuccModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Crown size={20} style={{ color: '#f59e0b' }} /> Create Succession Plan</h2>
            <div className="form-group"><label className="form-label">Position</label>
              <input className="form-input" value={newPlan.position} onChange={e => setNewPlan({ ...newPlan, position: e.target.value })} placeholder="e.g. VP Engineering" /></div>
            <div className="form-group"><label className="form-label">Department</label>
              <input className="form-input" value={newPlan.department} onChange={e => setNewPlan({ ...newPlan, department: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Criticality</label>
              <select className="form-input" value={newPlan.criticality} onChange={e => setNewPlan({ ...newPlan, criticality: e.target.value })}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowSuccModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createSuccPlan} disabled={!newPlan.position}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
