'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Bot, ArrowLeft, Play, Loader2, Star, MessageSquare, CheckCircle2, 
  XCircle, RefreshCw, BarChart2, ClipboardList, Lightbulb, Clock, Mic, MicOff, Check, X, ShieldAlert, Award, AlertTriangle, Flag
} from 'lucide-react';

type Phase = 'loading' | 'ready' | 'interviewing' | 'evaluating' | 'complete';

interface Question {
  question: string;
  category: string;
  difficulty: string;
}

interface QAPair {
  question: string;
  answer: string;
  score?: number;
  feedback?: string;
  follow_up?: string | null;
  keywords?: string[];
}

const DIFF_COLOR: Record<string, string> = {
  easy: 'var(--accent-green)', medium: 'var(--accent-orange)', hard: 'var(--accent-red)',
};

const REC_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  hire:       { label: 'Recommend Hire',       color: 'var(--accent-green)', Icon: CheckCircle2 },
  next_round: { label: 'Next Round',            color: 'var(--accent-orange)', Icon: RefreshCw },
  reject:     { label: 'Not Recommended',       color: 'var(--accent-red)', Icon: XCircle },
};

export default function LiveInterviewPage() {
  const { id } = useParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('loading');
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [liveScore, setLiveScore] = useState<{ score: number; feedback: string; follow_up: string | null } | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(120); // 2 min per question
  const [timerActive, setTimerActive] = useState(false);
  const [listening, setListening] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Start session on mount
  useEffect(() => {
    if (!id) return;
    api.startInterviewSession(Number(id))
      .then((data: any) => {
        setSession(data);
        setQuestions(data.questions);
        setPhase('ready');
      })
      .catch(e => { console.error(e); setPhase('ready'); });
  }, [id]);

  // Timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerActive && timeLeft === 0) {
      handleSubmitAnswer(true); // auto-submit on timeout
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timerActive, timeLeft]);

  const startInterview = () => {
    setPhase('interviewing');
    setTimerActive(true);
    textareaRef.current?.focus();
  };

  const handleSubmitAnswer = async (autoSubmit = false) => {
    if (evaluating) return;
    const finalAnswer = autoSubmit ? (answer || '[No answer — time expired]') : answer;
    setTimerActive(false);
    setEvaluating(true);
    setLiveScore(null);

    try {
      const result: any = await api.evaluateAnswer({
        interview_id: Number(id),
        question_index: currentQ,
        question: questions[currentQ].question,
        answer: finalAnswer,
        job_title: session?.job_title || '',
      });

      const pair: QAPair = {
        question: questions[currentQ].question,
        answer: finalAnswer,
        score: result.score,
        feedback: result.feedback,
        follow_up: result.follow_up,
        keywords: result.keywords_detected || [],
      };

      setLiveScore({ score: result.score, feedback: result.feedback, follow_up: result.follow_up });
      setQaPairs(prev => [...prev, pair]);
    } catch {
      setQaPairs(prev => [...prev, { question: questions[currentQ].question, answer: finalAnswer }]);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      handleFinish();
    } else {
      setCurrentQ(q => q + 1);
      setAnswer('');
      setLiveScore(null);
      setTimeLeft(120);
      setTimerActive(true);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleFinish = async () => {
    setPhase('evaluating');
    try {
      const result: any = await api.finalEvaluation({
        interview_id: Number(id),
        qa_pairs: qaPairs,
        job_title: session?.job_title || '',
      });
      setFinalResult(result);
      setPhase('complete');
    } catch (e) {
      console.error(e);
      setPhase('complete');
    }
  };

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Use Chrome.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setAnswer(transcript);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const scoreColor = (s: number) => s >= 4 ? 'var(--accent-green)' : s >= 3 ? 'var(--accent-orange)' : 'var(--accent-red)';
  const timerColor = timeLeft <= 30 ? 'var(--accent-red)' : timeLeft <= 60 ? 'var(--accent-orange)' : 'var(--accent-green)';
  const progress = ((currentQ + (liveScore ? 1 : 0)) / (questions.length || 1)) * 100;

  // ── LOADING ──
  if (phase === 'loading') return (
    <div className="loading-page">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Preparing your AI interview...</div>
      </div>
    </div>
  );

  // ── READY ──
  if (phase === 'ready') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Bot size={64} strokeWidth={1.5} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>AI Interview Room</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 15, marginBottom: 8 }}>
          {session?.candidate_name && <><strong style={{ color: 'var(--text-primary)' }}>{session.candidate_name}</strong> · </>}
          {session?.job_title}
        </p>
        <div className="card" style={{ marginBottom: 24, textAlign: 'left' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Interview Details
          </h3>
          {[
            ['Interview Round', `Round ${session?.round_number || 1}`],
            ['Questions', `${questions.length} questions`],
            ['Type', session?.interview_type?.replace('_', ' ') || 'Technical'],
            ['Time per question', '2 minutes'],
            ['AI Evaluation', 'Real-time scoring after each answer'],
            ['Voice Input', 'Available (Chrome recommended)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <button className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={startInterview}>
            <Play size={16} />
            <span>Start Interview</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ── EVALUATING ──
  if (phase === 'evaluating') return (
    <div className="loading-page">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Loader2 size={18} className="animate-spin" />
          <span>AI is evaluating your interview...</span>
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Analyzing {qaPairs.length} answers across all dimensions</div>
      </div>
    </div>
  );

  // ── COMPLETE ──
  if (phase === 'complete' && finalResult) {
    const ev = finalResult.evaluation;
    const rec = REC_CONFIG[finalResult.recommendation] || REC_CONFIG.next_round;
    const RecIcon = rec.Icon;
    const avgScore = qaPairs.filter(q => q.score).reduce((s, q) => s + (q.score || 0), 0) / (qaPairs.filter(q => q.score).length || 1);

    return (
      <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: rec.color, marginBottom: 16 }}>
            <RecIcon size={64} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Interview Complete</h1>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 20, fontSize: 15, fontWeight: 700,
            background: `${rec.color}20`, color: rec.color, border: `2px solid ${rec.color}44`,
          }}>
            {rec.label}
          </div>
        </div>

        {/* Score cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={18} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Overall Score</div>
              <div className="stat-value" style={{ color: scoreColor(ev.overall_score) }}>{ev.overall_score}/5</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Avg Answer Score</div>
              <div className="stat-value" style={{ color: scoreColor(avgScore) }}>{avgScore.toFixed(1)}/5</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Questions Answered</div>
              <div className="stat-value">{qaPairs.length}/{questions.length}</div>
            </div>
          </div>
        </div>

        {/* Dimension scores */}
        {ev.scores && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={16} style={{ color: 'var(--primary)' }} />
              <span>Dimension Scores</span>
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(ev.scores).map(([dim, score]: any) => (
                <div key={dim}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{dim.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 700, color: scoreColor(score) }}>{score}/5</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(score / 5) * 100}%`, background: scoreColor(score), borderRadius: 3, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Feedback */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={16} style={{ color: 'var(--primary)' }} />
            <span>AI Feedback</span>
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{ev.feedback}</p>
        </div>

        {/* Q&A Review */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={16} style={{ color: 'var(--primary)' }} />
            <span>Answer Review</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {qaPairs.map((qa, i) => (
              <div key={i} style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 10, borderLeft: `3px solid ${scoreColor(qa.score || 3)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Q{i + 1}</span>
                  {qa.score && <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(qa.score) }}>{qa.score}/5</span>}
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{qa.question}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: qa.feedback ? 8 : 0 }}>{qa.answer || '—'}</p>
                {qa.feedback && (
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                    <Lightbulb size={13} style={{ color: 'var(--accent-orange)', flexShrink: 0 }} />
                    <span>{qa.feedback}</span>
                  </p>
                )}
                {qa.keywords && qa.keywords.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {qa.keywords.map(k => (
                      <span key={k} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(37,99,235,0.15)', color: 'var(--primary)' }}>{k}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => router.push('/interviews')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} />
            <span>Back to Interviews</span>
          </button>
        </div>
      </div>
    );
  }

  // ── INTERVIEWING ──
  const q = questions[currentQ];
  const answered = !!liveScore;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 760, margin: '0 auto', padding: '24px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bot size={14} style={{ color: 'var(--primary)' }} />
            <span>AI Interview · {session?.job_title}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{session?.candidate_name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Timer */}
          {!answered && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: `${timerColor}15`, border: `1.5px solid ${timerColor}44`,
              color: timerColor, fontWeight: 700, fontSize: 14, fontFamily: 'monospace',
            }}>
              <Clock size={14} />
              <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </div>
          )}
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600 }}>
            {currentQ + 1} / {questions.length}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--bg-input)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent-purple))', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>

      {/* Question card */}
      <div className="card" style={{ marginBottom: 20, borderTop: `3px solid ${DIFF_COLOR[q?.difficulty] || 'var(--primary)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: `${DIFF_COLOR[q?.difficulty] || 'var(--primary)'}20`, color: DIFF_COLOR[q?.difficulty] || 'var(--primary)', textTransform: 'uppercase' }}>
            {q?.difficulty}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{q?.category}</span>
        </div>
        <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.6, color: 'var(--text-primary)' }}>
          {q?.question}
        </p>
      </div>

      {/* Answer area */}
      {!answered ? (
        <>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here... Be specific and use examples where possible."
              rows={6}
              style={{
                width: '100%', padding: '14px 16px', boxSizing: 'border-box',
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 12, color: 'var(--text-primary)', fontSize: 14,
                fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none',
                lineHeight: 1.6,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 11, color: 'var(--text-tertiary)' }}>
              {answer.split(/\s+/).filter(Boolean).length} words
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={toggleVoice}
              style={{
                padding: '10px 16px', borderRadius: 10, border: `1.5px solid ${listening ? 'var(--accent-red)' : 'var(--border)'}`,
                background: listening ? 'var(--accent-red-light)' : 'var(--bg-input)',
                color: listening ? 'var(--accent-red)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {listening ? (
                <>
                  <MicOff size={15} />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Mic size={15} />
                  <span>Voice</span>
                </>
              )}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => handleSubmitAnswer(false)}
              disabled={evaluating || !answer.trim()}
            >
              <span>Submit Answer</span>
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => handleSubmitAnswer(false)}
              disabled={evaluating || !answer.trim()}
            >
              {evaluating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Submit & Get Feedback</span>
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        /* Live feedback panel */
        <div className="card animate-scale-in" style={{ borderLeft: `4px solid ${scoreColor(liveScore!.score)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: `${scoreColor(liveScore!.score)}20`,
              border: `2px solid ${scoreColor(liveScore!.score)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 16, color: scoreColor(liveScore!.score),
            }}>
              {liveScore!.score}/5
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {liveScore!.score >= 4 ? 'Excellent answer!' : liveScore!.score >= 3 ? 'Good answer' : 'Could be stronger'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>AI Feedback</div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: liveScore!.follow_up ? 12 : 0 }}>
            {liveScore!.feedback}
          </p>
          {liveScore!.follow_up && (
            <div style={{ padding: '10px 14px', background: 'var(--primary-light)', borderRadius: 8, fontSize: 13, color: 'var(--primary)', marginBottom: 0, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <MessageSquare size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Follow-up: {liveScore!.follow_up}</span>
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleNextQuestion} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {currentQ + 1 >= questions.length ? (
                <>
                  <Flag size={14} />
                  <span>Finish & Get Report</span>
                </>
              ) : (
                <span>Next Question →</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Previous answers mini-log */}
      {qaPairs.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Previous Answers
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {qaPairs.map((qa, i) => (
              <div key={i} style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: `${scoreColor(qa.score || 3)}15`,
                color: scoreColor(qa.score || 3),
                border: `1px solid ${scoreColor(qa.score || 3)}33`,
              }}>
                Q{i + 1}: {qa.score ? `${qa.score}/5` : '—'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
