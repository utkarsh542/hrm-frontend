'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Pipeline, Interview } from '@/types';
import { getScoreClass, formatDateTime } from '@/lib/utils';
import { 
  Users, Star, MessageSquare, CheckCircle2, AlertCircle, Bot, Plus, X, 
  MapPin, Phone, Mail, FileText, Briefcase, Calendar, ClipboardList, Info, Loader2, ArrowRight, Target
} from 'lucide-react';

const STAGES = [
  { key: 'applied', label: 'Applied', color: 'var(--primary)' },
  { key: 'screening', label: 'Screening', color: 'var(--accent-orange)' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'var(--accent-purple)' },
  { key: 'interview', label: 'Interview', color: 'var(--accent-cyan)' },
  { key: 'offered', label: 'Offered', color: 'var(--accent-green)' },
  { key: 'hired', label: 'Hired', color: 'var(--accent-green)' },
  { key: 'joined', label: 'Joined', color: 'var(--primary-dark)' },
  { key: 'rejected', label: 'Rejected', color: 'var(--accent-red)' },
];

export default function CandidatesPipelinePage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'interviews'>('pipeline');

  // Load active tab from query parameter safely on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'interviews') {
        setActiveTab('interviews');
      }
    }
  }, []);

  const [pipeline, setPipeline] = useState<Pipeline>({});
  const [loading, setLoading] = useState(true);
  const [showRejected, setShowRejected] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Interviews scheduling/scorecard states
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [submittingScorecard, setSubmittingScorecard] = useState(false);
  const [scorecardForm, setScorecardForm] = useState({
    technical_score: 3,
    communication_score: 3,
    cultural_fit_score: 3,
    feedback: '',
    recommendation: 'next_round',
    status: 'completed',
    autoRejectApplication: true
  });
  const [applications, setApplications] = useState<any[]>([]);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [interviewSuccess, setInterviewSuccess] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    application_id: '',
    interview_type: 'technical',
    scheduled_at: '',
    duration_minutes: 60,
    interviewer_name: '',
    interviewer_email: '',
    round_number: 1,
  });

  // Dossier States
  const [showDossier, setShowDossier] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<any | null>(null);
  const [candidateInterviews, setCandidateInterviews] = useState<Interview[]>([]);
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Offer Letter States
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [ctc, setCtc] = useState<number>(800000);
  const [joiningDate, setJoiningDate] = useState('');
  const [probationMonths, setProbationMonths] = useState<number>(6);
  const [validUntil, setValidUntil] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getPipeline().then((data) => setPipeline(data as Pipeline)),
      api.getInterviews().then((data) => setInterviews(data as Interview[]))
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  const handleMove = async (appId: number, newStatus: string) => {
    try {
      await api.updateApplication(appId, { status: newStatus });
      const data = await api.getPipeline();
      setPipeline(data as Pipeline);
      showNotification(`Candidate successfully moved to ${newStatus.toUpperCase()}`, 'success');
    } catch (e: any) { 
      showNotification(e.message, 'error'); 
    }
  };

  const openDossier = async (item: any) => {
    setSelectedApp(item);
    setLoadingDossier(true);
    setCandidateProfile(null);
    setCandidateInterviews([]);
    setRecruiterNotes('');
    
    try {
      // 1. Fetch Candidate details
      const cands: any = await api.getCandidates(item.candidate_name);
      const cand = cands.find((c: any) => c.full_name === item.candidate_name);
      setCandidateProfile(cand || null);

      // 2. Fetch detailed applications to extract notes & ai_summary
      const apps: any = await api.getApplications();
      const appDetail = apps.find((a: any) => a.id === item.id);
      if (appDetail) {
        setRecruiterNotes(appDetail.notes || '');
        setSelectedApp({ 
          ...item, 
          notes: appDetail.notes || '', 
          ai_summary: appDetail.ai_summary || '', 
          ai_score: appDetail.ai_score || item.ai_score 
        });
      }

      // 3. Fetch Candidate's interviews
      const allInts: any = await api.getInterviews();
      const candInts = allInts.filter((i: any) => i.application_id === item.id);
      setCandidateInterviews(candInts);

      setShowDossier(true);
    } catch (e: any) {
      showNotification("Failed to load candidate dossier: " + e.message, 'error');
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setSavingNotes(true);
    try {
      await api.updateApplication(selectedApp.id, { notes: recruiterNotes });
      setSelectedApp((prev: any) => ({ ...prev, notes: recruiterNotes }));
      showNotification("Recruiter private notes saved successfully!", 'success');
    } catch (e: any) {
      showNotification("Failed to save notes: " + e.message, 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const getFutureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const openOfferModal = () => {
    setCtc(candidateProfile?.expected_salary || 800000);
    setJoiningDate(getFutureDate(30));
    setValidUntil(getFutureDate(7));
    setProbationMonths(6);
    setShowOfferModal(true);
  };

  const handleSendOffer = async () => {
    if (!selectedApp) return;
    setSendingOffer(true);
    try {
      await api.sendOffer(selectedApp.id, {
        ctc,
        joining_date: joiningDate,
        probation_months: probationMonths,
        valid_until: validUntil
      });
      showNotification("Job Offer & Salary Annexure emailed successfully!", "success");
      const data = await api.getPipeline();
      setPipeline(data as Pipeline);
      setShowOfferModal(false);
      setShowDossier(false);
    } catch (e: any) {
      showNotification("Failed to send offer: " + e.message, "error");
    } finally {
      setSendingOffer(false);
    }
  };

  const handleRemove = async (appId: number) => {
    try {
      await api.deleteApplication(appId);
      const data = await api.getPipeline();
      setPipeline(data as Pipeline);
      showNotification("Candidate successfully removed from pipeline", "success");
    } catch (e: any) {
      showNotification("Failed to remove candidate: " + e.message, "error");
    }
  };

  // ===== INTERVIEW TAB HELPER FUNCTIONS =====
  const openScorecard = (interview: Interview) => {
    setSelectedInterview(interview);
    setScorecardForm({
      technical_score: interview.technical_score || 3,
      communication_score: interview.communication_score || 3,
      cultural_fit_score: interview.cultural_fit_score || 3,
      feedback: interview.feedback || '',
      recommendation: interview.recommendation || 'next_round',
      status: interview.status || 'completed',
      autoRejectApplication: true
    });
    setInterviewError(null);
    setInterviewSuccess(null);
    setShowScorecardModal(true);
  };

  const handleScorecardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInterviewError(null);
    setInterviewSuccess(null);
    if (!selectedInterview) return;

    setSubmittingScorecard(true);
    try {
      await api.updateInterview(selectedInterview.id, {
        technical_score: Number(scorecardForm.technical_score),
        communication_score: Number(scorecardForm.communication_score),
        cultural_fit_score: Number(scorecardForm.cultural_fit_score),
        feedback: scorecardForm.feedback,
        recommendation: scorecardForm.recommendation,
        status: scorecardForm.status,
      });

      if (scorecardForm.recommendation === 'reject' && scorecardForm.autoRejectApplication) {
        await api.updateApplication(selectedInterview.application_id, { status: 'rejected' });
      }

      setInterviewSuccess("Scorecard submitted successfully!");
      const data = await api.getInterviews();
      setInterviews(data as Interview[]);

      // Refresh pipeline in background in case status changes
      const pipeData = await api.getPipeline();
      setPipeline(pipeData as Pipeline);

      setTimeout(() => {
        setInterviewSuccess(null);
        setShowScorecardModal(false);
      }, 1500);
    } catch (err: any) {
      setInterviewError(err.message || "Failed to submit scorecard.");
    } finally {
      setSubmittingScorecard(false);
    }
  };

  const renderStarRating = (field: 'technical_score' | 'communication_score' | 'cultural_fit_score', value: number) => {
    return (
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setScorecardForm({ ...scorecardForm, [field]: star })}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: star <= value ? 'var(--accent-orange)' : 'var(--text-tertiary)',
              transition: 'transform 0.15s ease',
              padding: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            <Star size={24} fill={star <= value ? 'var(--accent-orange)' : 'none'} strokeWidth={star <= value ? 1.5 : 2} />
          </button>
        ))}
        <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          {value}/5
        </span>
      </div>
    );
  };

  const openSchedule = async () => {
    setInterviewError(null);
    setInterviewSuccess(null);
    try {
      const apps = await api.getApplications();
      setApplications(apps as any[]);
      setShowScheduleModal(true);
    } catch (e: any) {
      setInterviewError("Failed to load candidate applications: " + e.message);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInterviewError(null);
    setInterviewSuccess(null);

    if (!scheduleForm.application_id) {
      setInterviewError("Please select a candidate application.");
      return;
    }
    if (!scheduleForm.scheduled_at) {
      setInterviewError("Please select a date and time.");
      return;
    }
    if (!scheduleForm.interviewer_name.trim()) {
      setInterviewError("Interviewer name is required.");
      return;
    }

    const selectedApp = applications.find(a => a.id === Number(scheduleForm.application_id));
    if (!selectedApp) {
      setInterviewError("Selected application not found.");
      return;
    }

    setScheduling(true);
    try {
      await api.scheduleInterview({
        application_id: selectedApp.id,
        candidate_id: selectedApp.candidate_id,
        job_id: selectedApp.job_id,
        interview_type: scheduleForm.interview_type,
        scheduled_at: new Date(scheduleForm.scheduled_at).toISOString(),
        duration_minutes: Number(scheduleForm.duration_minutes),
        interviewer_name: scheduleForm.interviewer_name,
        interviewer_email: scheduleForm.interviewer_email || undefined,
        round_number: Number(scheduleForm.round_number),
      });

      setInterviewSuccess("Interview scheduled successfully!");
      setScheduleForm({
        application_id: '',
        interview_type: 'technical',
        scheduled_at: '',
        duration_minutes: 60,
        interviewer_name: '',
        interviewer_email: '',
        round_number: 1,
      });
      
      const data = await api.getInterviews();
      setInterviews(data as Interview[]);

      setTimeout(() => {
        setInterviewSuccess(null);
        setShowScheduleModal(false);
      }, 1500);
    } catch (err: any) {
      setInterviewError(err.message || "Failed to schedule interview.");
    } finally {
      setScheduling(false);
    }
  };

  const handleAiInterview = async (id: number) => {
    setInterviewError(null);
    try {
      const result: any = await api.runAiInterview(id);
      showNotification(`AI Interview Complete! Score: ${result.evaluation.overall_score}/5. Recommendation: ${result.evaluation.recommendation.toUpperCase()}`, "success");
      const data = await api.getInterviews();
      setInterviews(data as Interview[]);
    } catch (e: any) {
      setInterviewError("Error starting AI Interview: " + e.message);
      setTimeout(() => setInterviewError(null), 5000);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'badge-success';
      case 'scheduled': return 'badge-info';
      case 'no_show': return 'badge-danger';
      case 'cancelled': return 'badge-neutral';
      default: return 'badge-primary';
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {activeTab === 'pipeline' ? (
            <>
              <Users style={{ color: 'var(--primary)' }} size={28} /> Candidates Pipeline
            </>
          ) : (
            <>
              <Target style={{ color: 'var(--primary)' }} size={28} /> Interview Schedule
            </>
          )}
        </h1>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {activeTab === 'pipeline' ? (
            <>
              <button 
                className={`btn btn-sm ${showRejected ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowRejected(!showRejected)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                ✕ {showRejected ? 'Hide' : 'Show'} Rejected Column
              </button>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                {Object.values(pipeline).flat().length} total candidates
              </span>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={openSchedule}>
              <Plus size={16} /> Schedule Interview
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 20, 
        borderBottom: '1px solid var(--border)',
        paddingBottom: 0
      }}>
        <button
          onClick={() => setActiveTab('pipeline')}
          style={{ 
            borderRadius: '8px 8px 0 0', 
            padding: '10px 20px', 
            fontSize: '13px',
            fontWeight: 700,
            color: activeTab === 'pipeline' ? 'var(--primary)' : 'var(--text-tertiary)',
            border: 'none',
            borderBottom: activeTab === 'pipeline' ? '3px solid var(--primary)' : '3px solid transparent',
            background: activeTab === 'pipeline' ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Users size={15} /> Pipeline Board
        </button>
        <button
          onClick={() => setActiveTab('interviews')}
          style={{ 
            borderRadius: '8px 8px 0 0', 
            padding: '10px 20px', 
            fontSize: '13px',
            fontWeight: 700,
            color: activeTab === 'interviews' ? 'var(--primary)' : 'var(--text-tertiary)',
            border: 'none',
            borderBottom: activeTab === 'interviews' ? '3px solid var(--primary)' : '3px solid transparent',
            background: activeTab === 'interviews' ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Target size={15} /> Interview Schedule
        </button>
      </div>

      {activeTab === 'pipeline' ? (
        <div className="kanban-board">
          {STAGES.filter(s => s.key !== 'rejected' || showRejected).map(stage => {
            const items = pipeline[stage.key] || [];
            return (
              <div key={stage.key} className="kanban-column" style={stage.key === 'rejected' ? { border: '1px dashed rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.02)' } : {}}>
                <div className="kanban-column-header">
                  <span className="kanban-column-title" style={{ color: stage.color }}>
                    {stage.label}
                  </span>
                  <span className="kanban-count">{items.length}</span>
                </div>
                {items.map(item => (
                  <div 
                    key={item.id} 
                    className="kanban-card" 
                    style={stage.key === 'rejected' ? { borderColor: 'rgba(239, 68, 68, 0.25)' } : {}}
                    onClick={() => openDossier(item)}
                  >
                    <div className="kanban-card-name" style={stage.key === 'rejected' ? { color: 'var(--text-secondary)', textDecoration: 'line-through' } : {}}>{item.candidate_name}</div>
                    <div className="kanban-card-meta" style={{ marginBottom: 4 }}>{item.job_title}</div>
                    <div className="kanban-card-footer" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch', width: '100%', marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {item.ai_score !== undefined && item.ai_score !== null ? (
                          <span className={`kanban-score ${getScoreClass(item.ai_score)}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                            AI: {item.ai_score}
                          </span>
                        ) : <span />}
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{item.source}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end', flexWrap: 'wrap', width: '100%' }}>
                        {/* Move back option */}
                        {stage.key !== 'applied' && stage.key !== 'rejected' && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              const prevStage = STAGES[STAGES.findIndex(s => s.key === stage.key) - 1];
                              if (prevStage) handleMove(item.id, prevStage.key);
                            }}
                            style={{ 
                              padding: '3px 6px', 
                              fontSize: 9, 
                              minHeight: 20, 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border)'
                            }}
                            title="Move to Previous Stage"
                          >
                            ←
                          </button>
                        )}

                        {/* Reject candidate option */}
                        {stage.key !== 'rejected' && stage.key !== 'joined' && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(item.id, 'rejected');
                            }}
                            style={{ 
                              padding: '3px 6px', 
                              fontSize: 9, 
                              minHeight: 20, 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: 2,
                              background: 'var(--accent-red-light)',
                              color: 'var(--accent-red)',
                              border: '1px solid rgba(220, 38, 38, 0.15)'
                            }}
                            title="Reject Candidate"
                          >
                            ✕ Reject
                          </button>
                        )}

                        {/* Restore option if candidate is currently rejected */}
                        {stage.key === 'rejected' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(item.id, 'applied');
                            }}
                            style={{ 
                              padding: '3px 6px', 
                              fontSize: 9, 
                              minHeight: 20, 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: 'var(--primary-light)',
                              color: 'var(--primary-dark)',
                              border: '1px solid rgba(37, 99, 235, 0.15)'
                            }}
                            title="Restore to Applied"
                          >
                            Restore
                          </button>
                        )}

                        {/* Remove option if candidate is currently joined */}
                        {stage.key === 'joined' && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(item.id);
                            }}
                            style={{ 
                              padding: '3px 6px', 
                              fontSize: 9, 
                              minHeight: 20, 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: 2,
                              background: 'var(--accent-red-light)',
                              color: 'var(--accent-red)',
                              border: '1px solid rgba(220, 38, 38, 0.15)'
                            }}
                            title="Remove from Pipeline"
                          >
                            ✕ Remove
                          </button>
                        )}

                        {/* Advance candidate option */}
                        {stage.key !== 'joined' && stage.key !== 'rejected' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStage = STAGES[STAGES.findIndex(s => s.key === stage.key) + 1];
                              if (nextStage && nextStage.key === 'offered') {
                                showNotification("Please click 'Draft Offer & Annexure' in the dossier to send the PDF offer and advance the candidate.", "info");
                                openDossier(item);
                              } else if (nextStage && nextStage.key !== 'rejected') {
                                handleMove(item.id, nextStage.key);
                              }
                            }}
                            style={{ 
                              padding: '3px 6px', 
                              fontSize: 9, 
                              minHeight: 20, 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: 'var(--accent-green-light)',
                              color: 'var(--accent-green)',
                              border: '1px solid rgba(5, 150, 105, 0.15)'
                            }}
                            title="Advance to Next Stage"
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                    No candidates
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Informative Callout Banner */}
          <div style={{
            marginBottom: 20,
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.15)',
            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.05)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(37, 99, 235, 0.15)',
                color: 'var(--primary)',
                padding: 8,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>Candidate Journey & Interview Rounds Track</h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Each interview stage (e.g., Round 1 Behavioral, Round 2 Technical) is preserved as a separate scorecard record in the database. 
                  This protects historical assessment grades (like scores and transcripts) from being deleted when advancing candidates to the next round.
                </p>
              </div>
            </div>
          </div>

          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Scheduled</div>
                <div className="stat-value">{interviews.filter(i => i.status === 'scheduled').length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{interviews.filter(i => i.status === 'completed').length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-label">AI Interviews</div>
                <div className="stat-value">{interviews.filter(i => i.ai_score).length}</div>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Type</th>
                  <th>Round</th>
                  <th>Scheduled</th>
                  <th>Duration</th>
                  <th>Interviewer</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interviews.length > 0 ? (
                  interviews.map(interview => {
                    const candidateRounds = interviews
                      .filter(i => i.candidate_name === interview.candidate_name)
                      .sort((a, b) => (a.round_number || 1) - (b.round_number || 1) || new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

                    return (
                      <tr key={interview.id}>
                        <td style={{ fontWeight: 600, paddingBottom: candidateRounds.length > 1 ? '10px' : '14px' }}>
                          <div style={{ fontSize: '15px' }}>{interview.candidate_name}</div>
                          {candidateRounds.length > 1 && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 5, 
                              marginTop: 6, 
                              flexWrap: 'wrap'
                            }}>
                              {candidateRounds.map((r, idx) => (
                                <span key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  {idx > 0 && <span style={{ color: 'var(--text-tertiary)', fontSize: 9 }}>➔</span>}
                                  <span 
                                    style={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: 4, 
                                      padding: '2px 8px', 
                                      borderRadius: '6px', 
                                      background: r.id === interview.id ? 'var(--primary-light)' : 'var(--bg-secondary)',
                                      border: r.id === interview.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                                      color: r.id === interview.id ? 'var(--primary-dark)' : 'var(--text-secondary)',
                                      fontSize: '10px',
                                      fontWeight: r.id === interview.id ? 700 : 500,
                                      boxShadow: r.id === interview.id ? 'var(--shadow-glow)' : 'none'
                                    }}
                                    title={`${r.interview_type.toUpperCase()} round by ${r.interviewer_name || 'AI'} - ${r.status.toUpperCase()} ${r.overall_score ? `(${r.overall_score}/5)` : ''}`}
                                  >
                                    R{r.round_number || 1} {r.interview_type === 'ai_interview' ? 'AI' : r.interview_type.substring(0, 4).toUpperCase()}
                                    <span style={{ 
                                      width: 5, 
                                      height: 5, 
                                      borderRadius: '50%', 
                                      background: r.status === 'completed' ? 'var(--accent-green)' : r.status === 'scheduled' ? 'var(--accent-blue)' : 'var(--accent-red)'
                                    }} />
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>{interview.job_title}</td>
                        <td><span className="badge badge-info">{interview.interview_type.replace('_', ' ')}</span></td>
                        <td><span className="badge badge-primary" style={{ fontWeight: 700 }}>Round {interview.round_number || 1}</span></td>
                        <td>{formatDateTime(interview.scheduled_at)}</td>
                        <td>{interview.duration_minutes} min</td>
                        <td>{interview.interviewer_name || '—'}</td>
                        <td>
                          {interview.overall_score ? (
                            <span style={{ fontWeight: 700, color: interview.overall_score >= 4 ? 'var(--accent-green)' : interview.overall_score >= 3 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>
                              {interview.overall_score}/5
                            </span>
                          ) : '—'}
                        </td>
                        <td><span className={`badge ${getStatusBadgeClass(interview.status)}`}>{interview.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            {interview.status === 'scheduled' && (
                              <>
                                {(interview.interview_type === 'ai_interview' || !interview.interviewer_name) ? (
                                  <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAiInterview(interview.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <Bot size={13} />
                                    <span>AI Interview</span>
                                  </button>
                                ) : (
                                  <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    Human Led
                                  </span>
                                )}
                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => openScorecard(interview)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: 'rgba(37, 99, 235, 0.4)' }} title="Submit Human Interview Scorecard">
                                  <Star size={13} style={{ color: 'var(--accent-orange)' }} />
                                  <span>Scorecard</span>
                                </button>
                              </>
                            )}
                            {interview.status === 'completed' && (
                              <button type="button" className="btn btn-sm btn-secondary" onClick={() => openScorecard(interview)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <ClipboardList size={13} />
                                <span>View/Edit</span>
                              </button>
                            )}
                            {interview.recommendation && (
                              <span className={`badge ${interview.recommendation === 'hire' ? 'badge-success' : interview.recommendation === 'reject' ? 'badge-danger' : 'badge-warning'}`} style={{ marginLeft: 4 }}>
                                {interview.recommendation}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-tertiary)', fontSize: 13 }}>
                      No interviews scheduled yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Recruiter Candidate Dossier Modal */}
      {showDossier && selectedApp && (
        <div className="modal-overlay" onClick={() => setShowDossier(false)}>
          <div className="modal-content" style={{ maxWidth: 900, width: '90%', padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 18
                }}>
                  {selectedApp.candidate_name.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>{selectedApp.candidate_name}</h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
                    Applying for <strong style={{ color: 'var(--primary)' }}>{selectedApp.job_title}</strong> · Stage: <span style={{ textTransform: 'uppercase', fontWeight: 700 }} className="badge badge-primary">{selectedApp.status}</span>
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowDossier(false)}>✕</button>
            </div>
            
            <div className="modal-body dossier-grid">
              
              {/* Left Column - Candidate Profile Overview */}
              <div className="dossier-left">
                <div>
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-tertiary)', marginBottom: 12 }}>Contact Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                      <Mail size={14} />
                      <span style={{ wordBreak: 'break-all' }}>{selectedApp.candidate_email}</span>
                    </div>
                    {candidateProfile?.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                        <Phone size={14} />
                        <span>{candidateProfile.phone}</span>
                      </div>
                    )}
                    {candidateProfile?.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                        <MapPin size={14} />
                        <span>{candidateProfile.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-tertiary)', marginBottom: 12 }}>Application Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Experience</span>
                      <span style={{ fontWeight: 600 }}>{candidateProfile?.experience_years ?? 0} Years</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Notice Period</span>
                      <span style={{ fontWeight: 600 }}>{candidateProfile?.notice_period_days ?? 0} Days</span>
                    </div>
                    {candidateProfile?.expected_salary && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Expected Salary</span>
                        <span style={{ fontWeight: 600 }}>₹{candidateProfile.expected_salary.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Source</span>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedApp.source}</span>
                    </div>
                  </div>
                </div>

                {candidateProfile?.skills && (
                  <div>
                    <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-tertiary)', marginBottom: 8 }}>Skills Profile</h3>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {candidateProfile.skills.split(',').map((skill: string) => (
                        <span key={skill} className="badge badge-neutral" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6 }}>
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Timeline, Notes, AI match */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* AI Screening Review Box */}
                {selectedApp.ai_score !== undefined && selectedApp.ai_score !== null && (
                  <div style={{
                    padding: 16,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
                    border: '1px solid rgba(37, 99, 235, 0.15)',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: selectedApp.ai_score >= 80 ? 'rgba(16, 185, 129, 0.15)' : selectedApp.ai_score >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: selectedApp.ai_score >= 80 ? 'var(--accent-green)' : selectedApp.ai_score >= 60 ? 'var(--accent-orange)' : 'var(--accent-red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 16,
                      flexShrink: 0,
                      border: `2px solid ${selectedApp.ai_score >= 80 ? 'var(--accent-green)' : selectedApp.ai_score >= 60 ? 'var(--accent-orange)' : 'var(--accent-red)'}`
                    }}>
                      {selectedApp.ai_score}%
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                        <Bot size={16} style={{ color: 'var(--primary)' }} /> AI Resume Match Analysis
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {selectedApp.ai_summary || "The AI screened this candidate's resume and matched their experience structure."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Private Recruiter Desk Notes */}
                <div className="card" style={{ padding: 18 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClipboardList size={16} style={{ color: 'var(--primary)' }} />
                    <span>Recruiter Private Notes & Assessment Dossier</span>
                  </h3>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={recruiterNotes}
                    onChange={e => setRecruiterNotes(e.target.value)}
                    placeholder="Write recruiter private notes (e.g. key accomplishments, personality highlights, compensation requirements)..."
                    style={{ marginBottom: 12 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={handleSaveNotes} 
                      disabled={savingNotes}
                    >
                      {savingNotes ? 'Saving Notes...' : 'Save Notes'}
                    </button>
                  </div>
                </div>

                {/* Candidate Interview Timeline Journey */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={16} style={{ color: 'var(--primary)' }} />
                    <span>Interview & Assessment Journey ({candidateInterviews.length})</span>
                  </h3>
                  
                  {candidateInterviews.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {candidateInterviews.sort((a,b) => (a.round_number || 1) - (b.round_number || 1)).map((int) => (
                        <div 
                          key={int.id} 
                          style={{ 
                            padding: '14px 16px', 
                            background: 'var(--bg-input)', 
                            borderLeft: `4px solid ${int.status === 'completed' ? 'var(--accent-green)' : int.status === 'scheduled' ? 'var(--accent-blue)' : 'var(--accent-red)'}`,
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                            borderLeftWidth: 4
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                                Round {int.round_number || 1} · {int.interview_type.replace('_', ' ')}
                              </span>
                              <h4 style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 600 }}>
                                {int.interview_type === 'ai_interview' ? 'Automated AI Session' : `Taken by ${int.interviewer_name || 'HR Panel'}`}
                              </h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                              <span className={`badge ${getStatusBadgeClass(int.status)}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                                {int.status}
                              </span>
                              {int.overall_score && (
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-orange)' }}>
                                  Score: {int.overall_score}/5
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
                            {int.status === 'completed' ? (
                              <>
                                <div style={{ marginBottom: 6 }}><strong>Feedback:</strong> {int.feedback || int.ai_feedback || "No written remarks submitted."}</div>
                                {int.technical_score !== undefined && (
                                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                                    <span>Technical: <strong>{int.technical_score}/5</strong></span>
                                    <span>Communication: <strong>{int.communication_score}/5</strong></span>
                                    <span>Culture Fit: <strong>{int.cultural_fit_score}/5</strong></span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-tertiary)' }}>Scheduled: {formatDateTime(int.scheduled_at)}</span>
                                {int.meeting_link && (
                                  <a href={int.meeting_link} target="_blank" rel="noreferrer" style={{ fontSize: 12, textDecoration: 'underline', color: 'var(--primary)' }}>
                                    Meeting Room Link
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: '24px 16px',
                      background: 'var(--bg-input)',
                      border: '1px dashed var(--border)',
                      borderRadius: 12,
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      fontSize: 13
                    }}>
                      No interview rounds have been scheduled yet for this candidate.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={() => setShowDossier(false)}>Close Dossier</button>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedApp.status !== 'rejected' && (
                  <button 
                    className="btn btn-danger" 
                    onClick={() => { handleMove(selectedApp.id, 'rejected'); setShowDossier(false); }}
                  >
                    Reject Candidate
                  </button>
                )}
                {/* Draft Offer Button */}
                {selectedApp.status !== 'rejected' && selectedApp.status !== 'joined' && (
                  <button 
                    className="btn btn-info" 
                    onClick={openOfferModal}
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))', color: 'white', border: 'none' }}
                  >
                    Draft Offer & Annexure
                  </button>
                )}
                {selectedApp.status !== 'joined' && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      const idx = STAGES.findIndex(s => s.key === selectedApp.status);
                      const next = STAGES[idx + 1];
                      if (next && next.key === 'offered') {
                        openOfferModal();
                      } else if (next && next.key !== 'rejected') {
                        handleMove(selectedApp.id, next.key);
                        setShowDossier(false);
                      }
                    }}
                  >
                    Advance Pipeline
                  </button>
                )}
                {selectedApp.status === 'joined' && (
                  <button 
                    className="btn btn-danger" 
                    onClick={() => { handleRemove(selectedApp.id); setShowDossier(false); }}
                  >
                    ✕ Remove from Pipeline
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Job Offer & Salary Annexure Modal */}
      {showOfferModal && selectedApp && (
        <div className="modal-overlay" style={{ zIndex: 1010 }} onClick={() => setShowOfferModal(false)}>
          <div className="modal-content" style={{ maxWidth: 550, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 20 }}>
                <Briefcase style={{ color: 'var(--primary)' }} size={24} /> Draft Job Offer & Annexure
              </h2>
              <button className="modal-close" onClick={() => setShowOfferModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Annual CTC (INR)</label>
                <input 
                  type="number"
                  className="form-input"
                  value={ctc}
                  onChange={e => setCtc(Number(e.target.value))}
                  placeholder="e.g. 1200000"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Joining Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={joiningDate}
                    onChange={e => setJoiningDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Offer Valid Until</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Probation Period (Months)</label>
                <input 
                  type="number"
                  className="form-input"
                  value={probationMonths}
                  onChange={e => setProbationMonths(Number(e.target.value))}
                  placeholder="6"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Dynamic Compensation Annexure Preview Table */}
              {ctc > 0 && (
                <div style={{
                  background: 'rgba(37, 99, 235, 0.05)',
                  border: '1px solid rgba(37, 99, 235, 0.15)',
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 8
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>
                    Salary Structure Preview (Annexure)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Basic Salary (50% of CTC)</span>
                      <span><strong>₹{((ctc / 12) * 0.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> / mo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>House Rent Allowance (20% of CTC)</span>
                      <span><strong>₹{((ctc / 12) * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> / mo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Special Allowance (30% of CTC)</span>
                      <span><strong>₹{((ctc / 12) * 0.3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> / mo</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      paddingTop: 8, 
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      fontWeight: 700,
                      color: 'var(--accent-green)'
                    }}>
                      <span>Gross Monthly CTC</span>
                      <span>₹{(ctc / 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowOfferModal(false)} disabled={sendingOffer}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSendOffer}
                disabled={sendingOffer || !ctc || !joiningDate || !validUntil}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {sendingOffer ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Dispatching Offer Email...
                  </>
                ) : 'Send Job Offer & Annexure'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: '16px 20px',
          borderRadius: 12,
          background: 'var(--bg-card)',
          border: `1px solid ${
            notification.type === 'success' 
              ? 'var(--accent-green)' 
              : notification.type === 'error' 
              ? 'var(--accent-red)' 
              : 'var(--accent-blue)'
          }`,
          color: 'var(--text-primary)',
          backdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 280,
          maxWidth: 400,
          animation: 'slide-in 0.3s ease-out'
        }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: notification.type === 'success' 
              ? 'var(--accent-green)' 
              : notification.type === 'error' 
              ? 'var(--accent-red)' 
              : 'var(--accent-blue)' 
          }}>
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : notification.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
          </span>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
            {notification.message}
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: 14,
              padding: 4
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" style={{ zIndex: 1010 }} onClick={() => { setInterviewError(null); setInterviewSuccess(null); setShowScheduleModal(false); }}>
          <form className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()} onSubmit={handleScheduleSubmit}>
            <div className="modal-header">
              <h2>Schedule Interview</h2>
              <button type="button" className="modal-close" onClick={() => { setInterviewError(null); setInterviewSuccess(null); setShowScheduleModal(false); }}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {interviewError && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--accent-red-light)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: 'var(--accent-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, color: 'var(--accent-red)' }} />
                  <span>{interviewError}</span>
                </div>
              )}
              {interviewSuccess && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--accent-green-light)',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                  color: 'var(--accent-green)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0, color: 'var(--accent-green)' }} />
                  <span>{interviewSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Candidate Application *</label>
                <select 
                  className="form-select" 
                  value={scheduleForm.application_id} 
                  onChange={e => setScheduleForm({ ...scheduleForm, application_id: e.target.value })}
                >
                  <option value="">Select Candidate</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.candidate_name} — {app.job_title} ({app.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Interview Type</label>
                  <select 
                    className="form-select" 
                    value={scheduleForm.interview_type} 
                    onChange={e => setScheduleForm({ ...scheduleForm, interview_type: e.target.value })}
                  >
                    <option value="technical">Technical</option>
                    <option value="hr">HR</option>
                    <option value="manager">Manager</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="system_design">System Design</option>
                    <option value="ai_interview">AI Interview (Automated)</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Round Number</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="1" 
                    value={scheduleForm.round_number} 
                    onChange={e => setScheduleForm({ ...scheduleForm, round_number: +e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Scheduled Date & Time *</label>
                  <input 
                    className="form-input" 
                    type="datetime-local" 
                    value={scheduleForm.scheduled_at} 
                    onChange={e => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Duration (Minutes)</label>
                  <select 
                    className="form-select" 
                    value={scheduleForm.duration_minutes} 
                    onChange={e => setScheduleForm({ ...scheduleForm, duration_minutes: +e.target.value })}
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Interviewer Name *</label>
                  <input 
                    className="form-input" 
                    value={scheduleForm.interviewer_name} 
                    onChange={e => setScheduleForm({ ...scheduleForm, interviewer_name: e.target.value })} 
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Interviewer Email (Optional)</label>
                  <input 
                    className="form-input" 
                    value={scheduleForm.interviewer_email} 
                    onChange={e => setScheduleForm({ ...scheduleForm, interviewer_email: e.target.value })} 
                    placeholder="e.g. john@company.com"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setInterviewError(null); setInterviewSuccess(null); setShowScheduleModal(false); }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={scheduling}>
                {scheduling ? 'Scheduling...' : 'Schedule Round'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scorecard Modal */}
      {showScorecardModal && selectedInterview && (
        <div className="modal-overlay" style={{ zIndex: 1010 }} onClick={() => { setInterviewError(null); setInterviewSuccess(null); setShowScorecardModal(false); }}>
          <form className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()} onSubmit={handleScorecardSubmit}>
            <div className="modal-header">
              <h2>{selectedInterview.status === 'completed' ? 'View / Edit Scorecard' : 'Submit Scorecard'}</h2>
              <button type="button" className="modal-close" onClick={() => { setInterviewError(null); setInterviewSuccess(null); setShowScorecardModal(false); }}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
              {interviewError && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--accent-red-light)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: 'var(--accent-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, color: 'var(--accent-red)' }} />
                  <span>{interviewError}</span>
                </div>
              )}
              {interviewSuccess && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--accent-green-light)',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                  color: 'var(--accent-green)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0, color: 'var(--accent-green)' }} />
                  <span>{interviewSuccess}</span>
                </div>
              )}

              <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 10, fontSize: 13, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><strong>Candidate:</strong> {selectedInterview.candidate_name}</div>
                <div><strong>Job:</strong> {selectedInterview.job_title}</div>
                <div><strong>Round & Type:</strong> Round {selectedInterview.round_number || 1} — {selectedInterview.interview_type.replace('_', ' ').toUpperCase()}</div>
                {selectedInterview.interviewer_name && <div><strong>Interviewer:</strong> {selectedInterview.interviewer_name}</div>}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Technical Knowledge Score *</label>
                {renderStarRating('technical_score', scorecardForm.technical_score)}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Communication Skill Score *</label>
                {renderStarRating('communication_score', scorecardForm.communication_score)}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Cultural Fit Score *</label>
                {renderStarRating('cultural_fit_score', scorecardForm.cultural_fit_score)}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Interview General Feedback & Notes *</label>
                <textarea
                  className="form-textarea"
                  required
                  rows={4}
                  value={scorecardForm.feedback}
                  onChange={e => setScorecardForm({ ...scorecardForm, feedback: e.target.value })}
                  placeholder="Provide specific details about candidate strengths, technical competency gaps, communication skills, or problem-solving behavior..."
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Interview Status</label>
                  <select
                    className="form-select"
                    value={scorecardForm.status}
                    onChange={e => setScorecardForm({ ...scorecardForm, status: e.target.value })}
                  >
                    <option value="completed">Completed</option>
                    <option value="scheduled">Scheduled / Pending</option>
                    <option value="no_show">Candidate No Show</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Interviewer Recommendation</label>
                  <select
                    className="form-select"
                    value={scorecardForm.recommendation}
                    onChange={e => setScorecardForm({ ...scorecardForm, recommendation: e.target.value })}
                  >
                    <option value="next_round">Next Round</option>
                    <option value="hire">Recommend Hire</option>
                    <option value="reject">Not Recommended / Reject</option>
                  </select>
                </div>
              </div>

              {scorecardForm.recommendation === 'reject' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--accent-red-light)',
                  border: '1px solid rgba(220, 38, 38, 0.15)',
                  fontSize: 13,
                  color: 'var(--accent-red)'
                }}>
                  <input
                    type="checkbox"
                    id="autoReject"
                    checked={scorecardForm.autoRejectApplication}
                    onChange={e => setScorecardForm({ ...scorecardForm, autoRejectApplication: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="autoReject" style={{ cursor: 'pointer', fontWeight: 500 }}>
                    Automatically mark candidate application as <strong>REJECTED</strong> in recruitment pipeline
                  </label>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setInterviewError(null); setInterviewSuccess(null); setShowScorecardModal(false); }}>Close</button>
              <button type="submit" className="btn btn-primary" disabled={submittingScorecard}>
                {submittingScorecard ? 'Saving Scorecard...' : 'Submit Scorecard'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
