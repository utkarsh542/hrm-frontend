'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PayrollRun } from '@/types';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { useRole, RoleGuard } from '@/lib/useRole';
import { Coins, BarChart2, Banknote, TrendingDown, CreditCard, ClipboardList, FileText, Play } from 'lucide-react';

export default function PayrollPage() {
  const { isAdminOrHR } = useRole();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [processing, setProcessing] = useState(false);

  const fetchRuns = async () => {
    try {
      const data = await api.getPayrollRuns();
      setRuns(data as PayrollRun[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRuns(); }, []);

  const handleRunPayroll = async () => {
    setProcessing(true);
    try {
      const result = await api.runPayroll(month, year);
      setShowRunModal(false);
      fetchRuns();
      setSelectedRun(result as PayrollRun);
    } catch (e: any) { alert(e.message); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Coins style={{ color: 'var(--primary)' }} size={28} /> Payroll
        </h1>
        {isAdminOrHR && (
          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowRunModal(true)}>
            <Play size={16} /> Run Payroll
          </button>
        )}
      </div>

      {isAdminOrHR && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon blue">
              <BarChart2 size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Runs</div>
              <div className="stat-value">{runs.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <Banknote size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Last Gross</div>
              <div className="stat-value">{runs[0] ? formatCurrency(runs[0].total_gross) : '₹0'}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">
              <TrendingDown size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Last Deductions</div>
              <div className="stat-value">{runs[0] ? formatCurrency(runs[0].total_deductions) : '₹0'}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
              <CreditCard size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Last Net Payout</div>
              <div className="stat-value">{runs[0] ? formatCurrency(runs[0].total_net) : '₹0'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Runs */}
      <div className="table-container" style={{ marginBottom: 24 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Period</th>
              {isAdminOrHR && <th>Employees</th>}
              {isAdminOrHR && <th>Gross Pay</th>}
              {isAdminOrHR && <th>Deductions</th>}
              {isAdminOrHR && <th>Net Pay</th>}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.map(run => (
              <tr key={run.id}>
                <td style={{ fontWeight: 600 }}>{MONTHS[run.month - 1]} {run.year}</td>
                {isAdminOrHR && <td>{run.total_employees}</td>}
                {isAdminOrHR && <td style={{ color: 'var(--accent-green)' }}>{formatCurrency(run.total_gross)}</td>}
                {isAdminOrHR && <td style={{ color: 'var(--accent-red)' }}>{formatCurrency(run.total_deductions)}</td>}
                {isAdminOrHR && <td style={{ fontWeight: 700 }}>{formatCurrency(run.total_net)}</td>}
                <td><span className={`badge badge-success`}>{run.status}</span></td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => setSelectedRun(run)}>
                    {isAdminOrHR ? 'View Payslips' : 'View Payslip'}
                  </button>
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr><td colSpan={isAdminOrHR ? 7 : 3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>No payroll runs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payslips Detail */}
      {selectedRun && (
        <div className="card animate-scale-in">
          <h3 style={{ fontSize: 16, marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList style={{ color: 'var(--primary)' }} size={20} />
              {isAdminOrHR ? `Payslips — ${MONTHS[selectedRun.month - 1]} ${selectedRun.year}` : `My Payslip — ${MONTHS[selectedRun.month - 1]} ${selectedRun.year}`}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRun(null)}>✕ Close</button>
          </h3>
          {selectedRun.payslips && selectedRun.payslips.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {isAdminOrHR && <th>Employee</th>}
                    {isAdminOrHR && <th>Code</th>}
                    <th>Basic</th>
                    <th>HRA</th>
                    <th>DA</th>
                    <th>Special</th>
                    <th>Gross</th>
                    <th>PF</th>
                    <th>TDS</th>
                    <th>Net</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRun.payslips.map(ps => (
                    <tr key={ps.id}>
                      {isAdminOrHR && <td style={{ fontWeight: 600 }}>{ps.employee_name}</td>}
                      {isAdminOrHR && <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{ps.employee_code}</td>}
                      <td>{formatCurrency(ps.basic_salary)}</td>
                      <td>{formatCurrency(ps.hra)}</td>
                      <td>{formatCurrency(ps.da)}</td>
                      <td>{formatCurrency(ps.special_allowance)}</td>
                      <td style={{ color: 'var(--accent-green)' }}>{formatCurrency(ps.total_earnings)}</td>
                      <td>{formatCurrency(ps.pf_employee)}</td>
                      <td>{formatCurrency(ps.tds)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(ps.net_salary)}</td>
                      <td>
                        <a href={api.downloadPayslip(ps.id)} target="_blank" className="btn btn-sm btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FileText size={14} /> PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)', fontSize: 14 }}>
              No payslip has been generated for you for this period. Please contact HR if you believe this is an error.
            </div>
          )}
        </div>
      )}

      {/* Run Payroll Modal */}
      {showRunModal && (
        <div className="modal-overlay" onClick={() => setShowRunModal(false)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Run Payroll</h2>
              <button className="modal-close" onClick={() => setShowRunModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Month</label>
                <select className="form-select" value={month} onChange={e => setMonth(+e.target.value)}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" type="number" value={year} onChange={e => setYear(+e.target.value)} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                This will process payroll for all active employees, calculating salary, deductions, and TDS.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRunModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleRunPayroll} disabled={processing}>
                {processing ? 'Processing...' : <><Play size={16} /> Run Payroll</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
