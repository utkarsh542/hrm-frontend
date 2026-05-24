'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Job } from '@/types';
import { formatCurrency, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { Briefcase, ClipboardList, Users, Building2, Plus } from 'lucide-react';

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', department: '', location: '', job_type: 'full_time',
    experience_min: 0, experience_max: 5, salary_min: 0, salary_max: 0,
    description: '', requirements: '', skills: '', openings: 1,
  });

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data as Job[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCreate = async () => {
    try {
      await api.createJob(formData);
      setShowCreateModal(false);
      setFormData({ title: '', department: '', location: '', job_type: 'full_time',
        experience_min: 0, experience_max: 5, salary_min: 0, salary_max: 0,
        description: '', requirements: '', skills: '', openings: 1 });
      fetchJobs();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Briefcase className="text-primary-light" size={28} /> Job Postings
        </h1>
        <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Create Job
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon green">
            <ClipboardList size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Open Jobs</div>
            <div className="stat-value">{jobs.filter(j => j.status === 'open').length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Applications</div>
            <div className="stat-value">{jobs.reduce((s, j) => s + j.applications_count, 0)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Openings</div>
            <div className="stat-value">{jobs.filter(j => j.status === 'open').reduce((s, j) => s + j.openings, 0)}</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Type</th>
              <th>Experience</th>
              <th>Salary Range</th>
              <th>Applications</th>
              <th>Status</th>
              <th>Posted</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 600 }}>{job.title}</td>
                <td>{job.department}</td>
                <td>{job.location}</td>
                <td><span className="badge badge-info">{job.job_type.replace('_', ' ')}</span></td>
                <td>{job.experience_min}-{job.experience_max} yrs</td>
                <td>{job.salary_min && job.salary_max ? `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max)}` : 'Not disclosed'}</td>
                <td><span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{job.applications_count}</span></td>
                <td><span className={`badge ${getStatusBadgeClass(job.status)}`}>{job.status}</span></td>
                <td>{formatDate(job.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Job Posting</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
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
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
