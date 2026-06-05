'use client';
import { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, RotateCw, CheckCircle, BarChart3, Sparkles,
  FileText, BookOpen, KeyRound, Handshake, Monitor, ChevronDown,
  AlertTriangle, Clock, Search, X,
} from 'lucide-react';

import { API_BASE } from '@/lib/api';

const API = API_BASE;
const hdrs = () => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) } as Record<string, string>;
};

interface OnboardingPlan {
  id: number; employee_id: number; employee_name: string; plan_name: string;
  department: string; role: string; status: string; ai_generated: boolean;
  total_tasks: number; completed_tasks: number; progress: number; created_at: string;
}
interface OnboardingTask {
  id: number; title: string; description: string; category: string;
  due_day: number; status: string; priority: string; notes: string | null; completed_at: string | null;
}

const categoryConfig: Record<string, { bg: string; color: string; label: string; Icon: any }> = {
  documentation: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Documentation', Icon: FileText },
  training: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', label: 'Training', Icon: BookOpen },
  access: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'Access', Icon: KeyRound },
  introduction: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Introduction', Icon: Handshake },
  equipment: { bg: 'rgba(249,115,22,0.15)', color: '#f97316', label: 'Equipment', Icon: Monitor },
};

export default function OnboardingPage() {
  const [plans, setPlans] = useState<OnboardingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<number>(0);
  const [generating, setGenerating] = useState(false);

  // Custom searchable employee dropdown states
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  useEffect(() => {
    const clickOutsideHandler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', clickOutsideHandler);
    return () => document.removeEventListener('mousedown', clickOutsideHandler);
  }, []);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try {
      const res = await fetch(`${API}/onboarding/plans`, { headers: hdrs() });
      const data = await res.json();
      setPlans(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadPlanDetails = async (planId: number) => {
    try {
      const res = await fetch(`${API}/onboarding/plans/${planId}`, { headers: hdrs() });
      const data = await res.json();
      setSelectedPlan(data);
    } catch (e) { console.error(e); }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch(`${API}/employees/`, { headers: hdrs() });
      const data = await res.json();
      setEmployees(data);
    } catch (e) { console.error(e); }
  };

  const generatePlan = async () => {
    if (!selectedEmpId) return;
    setGenerating(true);
    try {
      await fetch(`${API}/onboarding/generate-plan?employee_id=${selectedEmpId}`, { method: 'POST', headers: hdrs() });
      setShowModal(false);
      setSelectedEmpId(0);
      await loadPlans();
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  const updateTask = async (taskId: number, status: string) => {
    try {
      await fetch(`${API}/onboarding/tasks/${taskId}?status=${status}`, { method: 'PUT', headers: hdrs() });
      if (selectedPlan) await loadPlanDetails(selectedPlan.id);
      await loadPlans();
    } catch (e) { console.error(e); }
  };

  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.status === 'active').length;
  const completedPlans = plans.filter(p => p.status === 'completed').length;
  const avgProgress = plans.length > 0 ? Math.round(plans.reduce((s, p) => s + p.progress, 0) / plans.length) : 0;

  if (loading) return <div className="animate-fade-in" style={{ padding: 32 }}><p style={{ color: 'var(--text-secondary)' }}>Loading onboarding plans...</p></div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Sparkles size={20} strokeWidth={2} />
            </div>
            Smart Onboarding
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>AI-powered onboarding plans for new employees</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => { setShowModal(true); loadEmployees(); setSearchTerm(''); setSelectedEmp(null); setSelectedEmpId(0); setShowDropdown(false); }}>
          <Sparkles size={16} /> Generate AI Plan
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Plans', value: totalPlans, Icon: ClipboardList, color: 'var(--primary)' },
          { label: 'Active', value: activePlans, Icon: RotateCw, color: '#f59e0b' },
          { label: 'Completed', value: completedPlans, Icon: CheckCircle, color: '#10b981' },
          { label: 'Avg Progress', value: `${avgProgress}%`, Icon: BarChart3, color: '#3b82f6' },
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

      {/* Plans List */}
      {plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
            <ClipboardList size={28} strokeWidth={1.5} />
          </div>
          <h3 style={{ margin: '0 0 8px' }}>No Onboarding Plans Yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Click "Generate AI Plan" to create a personalized onboarding experience</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => selectedPlan?.id === plan.id ? setSelectedPlan(null) : loadPlanDetails(plan.id)}>
              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>
                    {plan.employee_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{plan.employee_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{plan.plan_name} · {plan.department}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  {plan.ai_generated && (
                    <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={12} /> AI Generated
                    </span>
                  )}
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: plan.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: plan.status === 'completed' ? '#10b981' : '#f59e0b' }}>
                    {plan.status.toUpperCase()}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: plan.progress === 100 ? '#10b981' : 'var(--primary)' }}>{plan.progress}%</div>
                    <div style={{ width: 100, height: 6, borderRadius: 3, background: 'var(--bg-input)', marginTop: 4 }}>
                      <div style={{ width: `${plan.progress}%`, height: '100%', borderRadius: 3, background: plan.progress === 100 ? '#10b981' : 'var(--primary)', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{plan.completed_tasks}/{plan.total_tasks} tasks</span>
                  <ChevronDown size={16} style={{ color: 'var(--text-secondary)', transform: selectedPlan?.id === plan.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </div>

              {selectedPlan?.id === plan.id && selectedPlan.tasks && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 24px', background: 'rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(selectedPlan.tasks as OnboardingTask[]).map((task: OnboardingTask) => {
                      const cat = categoryConfig[task.category] || categoryConfig.training;
                      const CatIcon = cat.Icon;
                      return (
                        <div key={task.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 18px',
                          borderRadius: 12,
                          background: task.status === 'completed' ? 'rgba(37, 99, 235, 0.03)' : 'var(--bg-card)',
                          border: task.status === 'completed' ? '1px dashed rgba(37, 99, 235, 0.3)' : '1px solid var(--border)',
                          transition: 'all 0.25s ease',
                          opacity: task.status === 'completed' ? 0.85 : 1,
                          boxShadow: task.status === 'completed' ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <button
                            type="button"
                            onClick={() => updateTask(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              border: task.status === 'completed' ? '2px solid var(--primary-light)' : '2px solid var(--text-tertiary)',
                              background: task.status === 'completed' ? 'var(--primary-light)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                              flexShrink: 0,
                              transition: 'all 0.2s ease',
                              boxShadow: task.status === 'completed' ? '0 0 10px rgba(37, 99, 235, 0.45)' : 'none',
                            }}
                          >
                            {task.status === 'completed' && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                          <span style={{ padding: '3px 8px', borderRadius: 6, background: cat.bg, color: cat.color, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CatIcon size={11} /> {cat.label}
                          </span>
                          <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={10} /> Day {task.due_day}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, textDecoration: task.status === 'completed' ? 'line-through' : 'none', opacity: task.status === 'completed' ? 0.6 : 1, transition: 'all 0.2s' }}>{task.title}</div>
                            {task.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, opacity: task.status === 'completed' ? 0.6 : 1 }}>{task.description}</div>}
                          </div>
                          <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3,
                            background: task.priority === 'high' ? 'rgba(239,68,68,0.15)' : task.priority === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                            color: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981' }}>
                            {task.priority === 'high' && <AlertTriangle size={10} />}
                            {task.priority}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generate Plan Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, padding: 0 }}>
            <div className="modal-header" style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700 }}>
                <Sparkles size={22} style={{ color: 'var(--primary)' }} /> Generate AI Onboarding Plan
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '24px 28px 12px' }}>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px', fontSize: 14, lineHeight: 1.5 }}>
                Select an employee from the active database to automatically generate a personalized, high-impact 30-day onboarding plan.
              </p>
            <div className="form-group" style={{ position: 'relative', marginBottom: 24 }} ref={dropdownRef}>
              <label className="form-label" style={{ fontWeight: 600 }}>Select Employee</label>
              
              {/* Searchable input trigger field - Rectangular with comfortable paddings */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search employee by name or role..."
                  value={searchTerm}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    if (selectedEmp && e.target.value !== selectedEmp.full_name) {
                      setSelectedEmp(null);
                      setSelectedEmpId(0);
                    }
                  }}
                  style={{
                    paddingLeft: 44, // Generous padding to completely clear the Search icon
                    paddingRight: 40, // Generous padding to clear the Clear icon
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 6, // Sleek rectangular border, no highly curved side capsules
                    width: '100%',
                    height: 42,
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
                
                {/* Search vector icon */}
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} />
                </span>
                
                {/* Clear / Toggle arrow */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedEmp || searchTerm) {
                      setSearchTerm('');
                      setSelectedEmp(null);
                      setSelectedEmpId(0);
                    } else {
                      setShowDropdown(!showDropdown);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {(selectedEmp || searchTerm) ? <X size={15} /> : <ChevronDown size={15} style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                </button>
              </div>

              {/* Rich Rectangular Dropdown Panel */}
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 6, // Clean breathing space separating input and panel
                  background: '#151525',
                  border: '1px solid var(--border)',
                  borderRadius: 6, // Match sleek rectangular style
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                  maxHeight: 180, // Nicely bounded height preventing screen overflow
                  overflowY: 'auto',
                  zIndex: 350,
                  padding: 8, // Generous padding to prevent items from touching borders
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  {employees.filter((emp: any) => 
                    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()))
                  ).length > 0 ? (
                    employees.filter((emp: any) => 
                      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).map((emp: any) => {
                      const isSelected = selectedEmpId === emp.id;
                      return (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmp(emp);
                            setSelectedEmpId(emp.id);
                            setSearchTerm(emp.full_name);
                            setShowDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px', // Generous internal padding to push text away from edges
                            borderRadius: 6, // Match rectangular shape
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                            border: isSelected ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid transparent',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {/* Rich Employee Avatar initials */}
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isSelected ? 'var(--primary-light)' : 'rgba(37, 99, 235, 0.12)',
                            color: isSelected ? '#ffffff' : 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {emp.full_name.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          
                          {/* Rich Employee Meta info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {emp.full_name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 2 }}>
                              {emp.designation || 'Active Employee'}
                            </div>
                          </div>
                          
                          {/* Checked Indicator */}
                          {isSelected && (
                            <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                              <CheckCircle size={14} fill="rgba(37, 99, 235, 0.1)" />
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                      No matching employees found
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
            <div className="modal-footer" style={{ padding: '20px 28px 24px', borderTop: '1px solid var(--border)', marginTop: 0 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={generatePlan} disabled={!selectedEmpId || generating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {generating ? <><RotateCw size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate Plan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
