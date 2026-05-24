'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Pipeline } from '@/types';
import { getScoreClass } from '@/lib/utils';
import { Users } from 'lucide-react';

const STAGES = [
  { key: 'applied', label: 'Applied', color: '#3b82f6' },
  { key: 'screening', label: 'Screening', color: '#f59e0b' },
  { key: 'shortlisted', label: 'Shortlisted', color: '#8b5cf6' },
  { key: 'interview', label: 'Interview', color: '#06b6d4' },
  { key: 'offered', label: 'Offered', color: '#10b981' },
  { key: 'hired', label: 'Hired', color: '#22c55e' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
];

export default function CandidatesPipelinePage() {
  const [pipeline, setPipeline] = useState<Pipeline>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPipeline()
      .then((data) => setPipeline(data as Pipeline))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMove = async (appId: number, newStatus: string) => {
    try {
      await api.updateApplication(appId, { status: newStatus });
      const data = await api.getPipeline();
      setPipeline(data as Pipeline);
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Users className="text-primary-light" size={28} /> Candidate Pipeline
        </h1>
        <div className="page-header-actions">
          <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            {Object.values(pipeline).flat().length} total candidates
          </span>
        </div>
      </div>

      <div className="kanban-board">
        {STAGES.filter(s => s.key !== 'rejected').map(stage => {
          const items = pipeline[stage.key] || [];
          return (
            <div key={stage.key} className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-title" style={{ color: stage.color }}>
                  {stage.label}
                </span>
                <span className="kanban-count">{items.length}</span>
              </div>
              {items.map(item => (
                <div key={item.id} className="kanban-card">
                  <div className="kanban-card-name">{item.candidate_name}</div>
                  <div className="kanban-card-meta">{item.job_title}</div>
                  <div className="kanban-card-meta">Source: {item.source}</div>
                  <div className="kanban-card-footer">
                    {item.ai_score !== undefined && item.ai_score !== null && (
                      <span className={`kanban-score ${getScoreClass(item.ai_score)}`}>
                        AI: {item.ai_score}
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {stage.key !== 'hired' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => {
                            const nextStage = STAGES[STAGES.findIndex(s => s.key === stage.key) + 1];
                            if (nextStage) handleMove(item.id, nextStage.key);
                          }}
                          style={{ padding: '3px 8px', fontSize: 11 }}
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
    </div>
  );
}
