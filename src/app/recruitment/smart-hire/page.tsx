'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import {
  FileUp, Sparkles, Loader2, User, Mail, Phone, Building2,
  Briefcase, CalendarDays, MapPin, GraduationCap, Target,
  FileText, Save, Rocket, PartyPopper,
} from 'lucide-react';

export default function SmartHirePage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [jobId, setJobId] = useState('');
  const [saved, setSaved] = useState<any>(null);

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (['pdf', 'docx', 'txt'].includes(ext || '')) {
      setFile(f); setParsed(null); setSaved(null);
    }
  };

  const parseResume = async () => {
    if (!file) return;
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await api.parseResume(formData);
      if (data.detail || data.error) {
        throw new Error(data.detail || data.error || 'Parsing failed');
      }
      setParsed(data);
    } catch (e: any) { alert('Parse error: ' + e.message); }
    finally { setParsing(false); }
  };

  const saveCandidate = async (applyToJob: boolean) => {
    if (!file) return;
    if (applyToJob && !jobId) {
      alert("Please enter a Job ID in the input field to apply, or click 'Save Candidate' to save without applying.");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await api.parseAndCreateCandidate(formData, applyToJob ? jobId : undefined);
      if (data.detail || data.error) {
        throw new Error(data.detail || data.error || 'Saving failed');
      }
      setSaved(data);
    } catch (e: any) { alert('Save error: ' + e.message); }
    finally { setSaving(false); }
  };

  const fieldIcons: Record<string, any> = {
    full_name: User, email: Mail, phone: Phone, current_company: Building2,
    current_designation: Briefcase, experience_years: CalendarDays,
    location: MapPin, education: GraduationCap,
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Sparkles size={20} strokeWidth={2} />
          </div>
          AI Smart Hire
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Upload a resume and let AI extract candidate information instantly</p>
      </div>

      {/* Upload Zone */}
      {!saved && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf,.docx,.txt'; input.onchange = (e: any) => { if (e.target.files[0]) handleFile(e.target.files[0]); }; input.click(); }}
          style={{
            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 20, padding: '48px 32px',
            textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s',
            background: dragOver ? 'rgba(37,99,235,0.08)' : 'var(--bg-card)',
            marginBottom: 24,
          }}
        >
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--primary)' }}>
            <FileUp size={30} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {file ? file.name : 'Drop a resume here or click to upload'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Supports PDF, DOCX, TXT · Max 10MB
          </div>
          {file && !parsed && !parsing && (
            <button className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={e => { e.stopPropagation(); parseResume(); }}>
              <Sparkles size={16} /> Parse Resume with AI
            </button>
          )}
          {parsing && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={20} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>AI is analyzing the resume...</span>
            </div>
          )}
        </div>
      )}

      {/* Parsed Results */}
      {parsed && !saved && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--accent-green-light)', color: 'var(--accent-green)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={12} /> PARSED
              </span>
              AI-Extracted Candidate Data
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { key: 'full_name', label: 'Full Name', value: parsed.full_name },
              { key: 'email', label: 'Email', value: parsed.email },
              { key: 'phone', label: 'Phone', value: parsed.phone },
              { key: 'current_company', label: 'Company', value: parsed.current_company },
              { key: 'current_designation', label: 'Designation', value: parsed.current_designation },
              { key: 'experience_years', label: 'Experience', value: parsed.experience_years ? `${parsed.experience_years} years` : '—' },
              { key: 'location', label: 'Location', value: parsed.location },
              { key: 'education', label: 'Education', value: parsed.education },
            ].map((field, i) => {
              const FIcon = fieldIcons[field.key] || FileText;
              return (
                <div key={i} className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FIcon size={12} /> {field.label}
                  </label>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', fontSize: 14 }}>
                    {field.value || <span style={{ color: 'var(--text-tertiary)' }}>Not found</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {parsed.skills && (
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Target size={12} /> Skills
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {parsed.skills.split(',').map((s: string, i: number) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(37,99,235,0.15)', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>{s.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {parsed.summary && (
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileText size={12} /> Summary
              </label>
              <p style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', margin: 0, fontSize: 14, lineHeight: 1.5 }}>{parsed.summary}</p>
            </div>
          )}

          {/* Job match */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <label className="form-label" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Briefcase size={12} /> Apply to Job (optional)
                </label>
                <input className="form-input" placeholder="Job ID (e.g. 1)" value={jobId} onChange={e => setJobId(e.target.value)} />
              </div>
              <button className="btn btn-secondary" onClick={() => saveCandidate(false)} disabled={saving} style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Candidate
              </button>
              <button className="btn btn-primary" onClick={() => saveCandidate(true)} disabled={saving} style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />} Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {saved && (
        <div style={{ background: 'var(--accent-green-light)', borderRadius: 16, padding: 32, border: '1px solid var(--accent-green)', textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-green)' }}>
            <PartyPopper size={32} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: 'var(--accent-green)', margin: '0 0 8px' }}>
            Candidate {saved.is_existing ? 'Updated' : 'Created'} Successfully!
          </h2>
          <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
            Successfully saved profile for <strong>{saved.candidate_name}</strong> (ID: {saved.candidate_id})
            {saved.application_id && ` and submitted application to Job #${saved.application_id}`}
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => { setFile(null); setParsed(null); setSaved(null); setJobId(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
          >
            <Sparkles size={16} /> Upload Another Resume
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
