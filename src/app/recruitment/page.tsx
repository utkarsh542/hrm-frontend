'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Job, Employee } from '@/types';
import { formatCurrency, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { Briefcase, ClipboardList, Users, Building2, Plus, AlertCircle, Sparkles, Send, UserCheck, Eye } from 'lucide-react';
import { useRole } from '@/lib/useRole';

// Stacking context portal helper to render modals directly under document.body
const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted ? createPortal(children, document.body) : null;
};

export default function RecruitmentPage() {
  const { role, email, isAdminHROrManager } = useRole();
  const isEmployee = role === 'employee';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Job Detail Modal State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);

  // Create Job Form Data
  const [formData, setFormData] = useState({
    title: '', department: '', location: '', job_type: 'full_time',
    experience_min: 0, experience_max: 5, salary_min: 0, salary_max: 0,
    description: '', requirements: '', skills: '', openings: 1,
  });

  // Apply Internally Form Data
  const [applyForm, setApplyForm] = useState({
    experience_years: 0,
    skills: '',
    notes: '',
  });

  // Refer Candidate Form Data
  const [referForm, setReferForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    experience_years: 0,
    skills: '',
    linkedin_url: '',
    notes: '',
  });

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data as Job[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchJobs();
    api.getEmployees()
      .then((data: any) => {
        setEmployees(data as Employee[]);
        const matched = (data as Employee[]).find(e => e.email.toLowerCase() === email.toLowerCase());
        if (matched) {
          setCurrentEmployee(matched);
          setApplyForm(prev => ({
            ...prev,
            experience_years: Math.round((new Date().getTime() - new Date(matched.joining_date).getTime()) / (1000 * 60 * 60 * 24 * 365) * 10) / 10,
          }));
        }
      })
      .catch(console.error);
  }, [email]);

  const handleCreate = async () => {
    setError(null);
    if (!formData.title.trim()) { setError("Job Title is required."); return; }
    if (!formData.department.trim()) { setError("Department is required."); return; }
    if (!formData.location.trim()) { setError("Location is required."); return; }
    if (!formData.description.trim()) { setError("Job Description is required."); return; }
    if (formData.experience_min < 0 || formData.experience_max < 0) { setError("Experience cannot be negative."); return; }
    if (formData.experience_min > formData.experience_max) { setError("Min Experience cannot exceed Max Experience."); return; }
    if (formData.salary_min < 0 || formData.salary_max < 0) { setError("Salary range cannot contain negative values."); return; }
    if (formData.salary_min > formData.salary_max) { setError("Min Salary cannot exceed Max Salary."); return; }
    if (formData.openings <= 0) { setError("Number of openings must be at least 1."); return; }

    try {
      await api.createJob(formData);
      setError(null);
      setShowCreateModal(false);
      setFormData({ title: '', department: '', location: '', job_type: 'full_time',
        experience_min: 0, experience_max: 5, salary_min: 0, salary_max: 0,
        description: '', requirements: '', skills: '', openings: 1 });
      fetchJobs();
    } catch (e: any) { setError(e.message); }
  };

  const handleApplyInternally = async () => {
    setError(null);
    setSuccessMessage(null);
    if (!selectedJob) return;

    try {
      let candidateId;
      // 1. Check if user already exists as a candidate
      try {
        const newCand: any = await api.createCandidate({
          full_name: currentEmployee ? currentEmployee.full_name : email.split('@')[0],
          email: email,
          phone: currentEmployee ? currentEmployee.phone : '',
          experience_years: applyForm.experience_years,
          skills: applyForm.skills || 'Internal Employee',
        });
        candidateId = newCand.id;
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes("already exists")) {
          // Fetch existing candidate
          const list: any = await api.getCandidates(email);
          const matched = list.find((c: any) => c.email.toLowerCase() === email.toLowerCase());
          if (matched) {
            candidateId = matched.id;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      // 2. Submit application for that candidate
      await api.createApplication({
        candidate_id: candidateId,
        job_id: selectedJob.id,
        source: 'website',
        notes: `Internal application by employee: ${currentEmployee ? currentEmployee.full_name : email} (${currentEmployee ? currentEmployee.employee_id : 'N/A'})\n\nCover Note: ${applyForm.notes}`,
      });

      setSuccessMessage("✅ Your internal application has been submitted successfully!");
      setShowApplyModal(false);
      setSelectedJob(null);
      fetchJobs();
    } catch (e: any) {
      setError(e.message || "Failed to submit internal application");
    }
  };

  const handleReferCandidate = async () => {
    setError(null);
    setSuccessMessage(null);
    if (!selectedJob) return;
    if (!referForm.full_name.trim()) { setError("Candidate Full Name is required."); return; }
    if (!referForm.email.trim()) { setError("Candidate Email is required."); return; }

    try {
      let candidateId;
      // 1. Create candidate profile
      try {
        const newCand: any = await api.createCandidate({
          full_name: referForm.full_name,
          email: referForm.email,
          phone: referForm.phone,
          experience_years: referForm.experience_years,
          skills: referForm.skills,
          linkedin_url: referForm.linkedin_url,
        });
        candidateId = newCand.id;
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes("already exists")) {
          const list: any = await api.getCandidates(referForm.email);
          const matched = list.find((c: any) => c.email.toLowerCase() === referForm.email.toLowerCase());
          if (matched) {
            candidateId = matched.id;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      // 2. Submit application with 'referral' source
      await api.createApplication({
        candidate_id: candidateId,
        job_id: selectedJob.id,
        source: 'referral',
        notes: `Referred by employee: ${currentEmployee ? currentEmployee.full_name : email} (${currentEmployee ? currentEmployee.employee_id : 'N/A'})\n\nReferral reason/notes: ${referForm.notes}`,
      });

      setSuccessMessage(`✅ Candidate referral for "${referForm.full_name}" submitted successfully!`);
      setShowReferModal(false);
      setSelectedJob(null);
      setReferForm({
        full_name: '', email: '', phone: '', experience_years: 0,
        skills: '', linkedin_url: '', notes: '',
      });
      fetchJobs();
    } catch (e: any) {
      setError(e.message || "Failed to submit candidate referral");
    }
  };

  const filteredJobs = isEmployee ? jobs.filter(j => j.status === 'open') : jobs;

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in page-container">
      <div className="page-header">
        <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Briefcase style={{ color: 'var(--primary)' }} size={28} /> {isEmployee ? 'Job Openings' : 'Job Postings'}
        </h1>
        {!isEmployee && (
          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => { setError(null); setSuccessMessage(null); setShowCreateModal(true); }}>
            <Plus size={16} /> Create Job
          </button>
        )}
      </div>

      {successMessage && (
        <div style={{
          marginBottom: 20,
          padding: '12px 20px',
          background: 'rgba(5, 150, 105, 0.15)',
          border: '1px solid rgba(5, 150, 105, 0.3)',
          borderRadius: '12px',
          color: 'var(--accent-green)',
          fontWeight: 600,
          fontSize: 14,
        }}>
          {successMessage}
        </div>
      )}

      {error && isEmployee && (
        <div style={{
          marginBottom: 20,
          padding: '12px 20px',
          background: 'rgba(220, 38, 38, 0.15)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '12px',
          color: 'var(--accent-red)',
          fontWeight: 600,
          fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats only for Admins/HR/Managers */}
      {!isEmployee && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon green"><ClipboardList size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Open Jobs</div>
              <div className="stat-value">{jobs.filter(j => j.status === 'open').length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Users size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Total Applications</div>
              <div className="stat-value">{jobs.reduce((s, j) => s + j.applications_count, 0)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><Building2 size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Total Openings</div>
              <div className="stat-value">{jobs.filter(j => j.status === 'open').reduce((s, j) => s + j.openings, 0)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Job Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Type</th>
              <th>Experience</th>
              <th>Salary Range</th>
              {!isEmployee && <th>Applications</th>}
              <th>Status</th>
              <th>Posted</th>
              {isEmployee && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan={isEmployee ? 10 : 10} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)' }}>
                  No open job opportunities at the moment.
                </td>
              </tr>
            )}
            {filteredJobs.map(job => (
              <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => { setError(null); setSuccessMessage(null); setSelectedJob(job); }}>
                <td style={{ fontWeight: 700, color: 'var(--text-tertiary)' }}>{job.id}</td>
                <td style={{ fontWeight: 600 }}>{job.title}</td>
                <td>{job.department}</td>
                <td>{job.location}</td>
                <td><span className="badge badge-info">{job.job_type.replace('_', ' ')}</span></td>
                <td>{job.experience_min}-{job.experience_max} yrs</td>
                <td>{job.salary_min && job.salary_max ? `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max)}` : 'Not disclosed'}</td>
                {!isEmployee && <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{job.applications_count}</span></td>}
                <td><span className={`badge ${getStatusBadgeClass(job.status)}`}>{job.status}</span></td>
                <td>{formatDate(job.created_at)}</td>
                {isEmployee && (
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Job Details Modal (Read-only + Action buttons for Employee) ── */}
      <ModalPortal>
        {selectedJob && (
          <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
            <div className="modal-content" style={{ maxWidth: 750 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{selectedJob.title}</h2>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                    {selectedJob.department} • {selectedJob.location} • <span className="badge badge-info">{selectedJob.job_type.replace('_', ' ')}</span>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setSelectedJob(null)}>✕</button>
              </div>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>Job Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Experience Required</label>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedJob.experience_min}-{selectedJob.experience_max} Years</div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Salary Range (Annual)</label>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {selectedJob.salary_min && selectedJob.salary_max ? `${formatCurrency(selectedJob.salary_min)} - ${formatCurrency(selectedJob.salary_max)}` : 'Not disclosed'}
                      </div>
                    </div>
                    {selectedJob.skills && (
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Preferred Skills</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                          {selectedJob.skills.split(',').map((s, i) => (
                            <span key={i} className="badge badge-neutral" style={{ fontSize: 11, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>{s.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Date Posted</label>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(selectedJob.created_at)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>Description</h4>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{selectedJob.description}</p>
                  
                  {selectedJob.requirements && (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>Requirements</h4>
                      <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{selectedJob.requirements}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setSelectedJob(null)}>Close</button>
                {isEmployee && selectedJob.status === 'open' && (
                  <>
                    <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowApplyModal(true)}>
                      <UserCheck size={16} /> Apply Internally
                    </button>
                    <button className="btn btn-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)', color: '#fff' }} onClick={() => setShowReferModal(true)}>
                      <Send size={16} /> Refer Someone
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ── Internal Apply Confirmation Modal ── */}
      <ModalPortal>
        {showApplyModal && selectedJob && (
          <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowApplyModal(false)}>
            <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Internal Application</h2>
                <button className="modal-close" onClick={() => setShowApplyModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  You are applying internally for the <strong>{selectedJob.title}</strong> position. Your employee profile information will be forwarded to the HR team.
                </p>
                
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" disabled value={currentEmployee ? currentEmployee.full_name : ''} />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Email</label>
                  <input className="form-input" disabled value={email} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Experience (Years)</label>
                    <input className="form-input" type="number" value={applyForm.experience_years} onChange={e => setApplyForm({...applyForm, experience_years: +e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Key Skills</label>
                    <input className="form-input" value={applyForm.skills} onChange={e => setApplyForm({...applyForm, skills: e.target.value})} placeholder="e.g. React, Python, QA" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Cover Note (Optional)</label>
                  <textarea className="form-textarea" rows={3} value={applyForm.notes} onChange={e => setApplyForm({...applyForm, notes: e.target.value})} placeholder="Why do you think you are a good fit for this role?" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleApplyInternally}>Submit Application</button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ── Candidate Referral Form Modal ── */}
      <ModalPortal>
        {showReferModal && selectedJob && (
          <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowReferModal(false)}>
            <div className="modal-content" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Refer a Candidate</h2>
                <button className="modal-close" onClick={() => setShowReferModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                {error && (
                  <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 8, color: 'var(--accent-red)', fontSize: 13 }}>
                    {error}
                  </div>
                )}
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Refer a talented candidate for the <strong>{selectedJob.title}</strong> role. The recruitment team will screen them with high priority.
                </p>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Candidate Name *</label>
                    <input className="form-input" value={referForm.full_name} onChange={e => setReferForm({...referForm, full_name: e.target.value})} placeholder="e.g. Amit Sen" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Candidate Email *</label>
                    <input className="form-input" type="email" value={referForm.email} onChange={e => setReferForm({...referForm, email: e.target.value})} placeholder="e.g. amit.sen@gmail.com" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" value={referForm.phone} onChange={e => setReferForm({...referForm, phone: e.target.value})} placeholder="e.g. +91 9999988888" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience (Years)</label>
                    <input className="form-input" type="number" value={referForm.experience_years} onChange={e => setReferForm({...referForm, experience_years: +e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Skills (comma-separated)</label>
                  <input className="form-input" value={referForm.skills} onChange={e => setReferForm({...referForm, skills: e.target.value})} placeholder="e.g. JavaScript, Selenium, Manual Testing" />
                </div>

                <div className="form-group">
                  <label className="form-label">LinkedIn URL</label>
                  <input className="form-input" value={referForm.linkedin_url} onChange={e => setReferForm({...referForm, linkedin_url: e.target.value})} placeholder="e.g. https://linkedin.com/in/username" />
                </div>

                <div className="form-group">
                  <label className="form-label">Referral Note *</label>
                  <textarea className="form-textarea" rows={3} value={referForm.notes} onChange={e => setReferForm({...referForm, notes: e.target.value})} placeholder="How do you know this candidate? What are their key strengths?" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowReferModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleReferCandidate}>Submit Referral</button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ── Create Job Modal (Admins/HR/Managers only) ── */}
      <ModalPortal>
        {showCreateModal && !isEmployee && (
          <div className="modal-overlay" onClick={() => { setError(null); setShowCreateModal(false); }}>
            <div className="modal-content" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create Job Posting</h2>
                <button className="modal-close" onClick={() => { setError(null); setShowCreateModal(false); }}>✕</button>
              </div>
              <div className="modal-body">
                {error && (
                  <div style={{
                    marginBottom: 16,
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
                    <span>{error}</span>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Job Title *</label>
                    <input className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Senior Developer" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <input className="form-input" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Engineering" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Location *</label>
                    <input className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Bangalore" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Job Type</label>
                    <select className="form-select" value={formData.job_type} onChange={e => setFormData({...formData, job_type: e.target.value})}>
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Min Exp (years)</label>
                    <input className="form-input" type="number" value={formData.experience_min} onChange={e => setFormData({...formData, experience_min: +e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Exp (years)</label>
                    <input className="form-input" type="number" value={formData.experience_max} onChange={e => setFormData({...formData, experience_max: +e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Openings</label>
                    <input className="form-input" type="number" value={formData.openings} onChange={e => setFormData({...formData, openings: +e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min Salary (Annual)</label>
                    <input className="form-input" type="number" value={formData.salary_min} onChange={e => setFormData({...formData, salary_min: +e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Salary (Annual)</label>
                    <input className="form-input" type="number" value={formData.salary_max} onChange={e => setFormData({...formData, salary_max: +e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Job description..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Skills (comma-separated)</label>
                  <input className="form-input" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, Python, AWS..." />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setError(null); setShowCreateModal(false); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate}>Create Job</button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
