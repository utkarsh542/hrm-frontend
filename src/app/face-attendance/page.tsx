'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { Camera, UserCheck, Flag, Clock, ShieldCheck, ClipboardList, Loader2, Video, AlertTriangle } from 'lucide-react';

export default function FaceAttendancePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [mode, setMode] = useState<'checkin' | 'checkout'>('checkin');
  const [showCamera, setShowCamera] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchData = async () => {
    try {
      const [emps, recs]: any = await Promise.all([
        api.getEmployees(),
        api.getFaceTodayRecords(),
      ]);
      setEmployees((emps as any[]).filter(e => e.is_active));
      setTodayRecords(recs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const startCamera = async () => {
    setShowCamera(true);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setResult({ success: false, message: 'Camera access denied. Please allow camera permissions.' });
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  const captureAndVerify = async () => {
    if (!selectedEmp || !videoRef.current || !canvasRef.current) return;
    setProcessing(true);
    try {
      const canvas = canvasRef.current;
      canvas.width = 320;
      canvas.height = 240;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 320, 240);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      let resp: any;
      if (mode === 'checkin') {
        resp = await api.faceCheckIn({ employee_id: selectedEmp.id, image_base64: imageBase64, location: 'office' });
      } else {
        resp = await api.faceCheckOut({ employee_id: selectedEmp.id, image_base64: imageBase64 });
      }
      setResult({ success: true, message: resp.message });
      stopCamera();
      fetchData();
    } catch (e: any) {
      setResult({ success: false, message: e.message || 'Verification failed' });
    } finally {
      setProcessing(false);
    }
  };

  const todayMap = new Map(todayRecords.map(r => [r.employee_id, r]));
  const checkedIn = todayRecords.filter(r => r.check_in && !r.check_out).length;
  const completed = todayRecords.filter(r => r.check_in && r.check_out).length;

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            <Camera size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Face Attendance</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginTop: 4 }}>
              AI-powered face verification check-in
            </p>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Checked In</div>
            <div className="stat-value">{checkedIn}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flag size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{completed}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Not Yet</div>
            <div className="stat-value">{employees.length - checkedIn - completed}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Employee selector + camera */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={18} style={{ color: 'var(--primary)' }} />
            <span>Verify & Check In/Out</span>
          </h3>

          {/* Mode toggle */}
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={`tab ${mode === 'checkin' ? 'active' : ''}`} onClick={() => setMode('checkin')}>Check In</button>
            <button className={`tab ${mode === 'checkout' ? 'active' : ''}`} onClick={() => setMode('checkout')}>Check Out</button>
          </div>

          {/* Employee select */}
          <div className="form-group">
            <label className="form-label">Select Employee</label>
            <select className="form-select" value={selectedEmp?.id || ''} onChange={e => setSelectedEmp(employees.find(emp => emp.id === +e.target.value) || null)}>
              <option value="">-- Select Employee --</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>)}
            </select>
          </div>

          {/* Camera */}
          {showCamera ? (
            <div style={{ textAlign: 'center' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 10, border: '2px solid var(--primary)', marginBottom: 12 }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={captureAndVerify} disabled={processing} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {processing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={16} />
                      <span>Capture & Verify</span>
                    </>
                  )}
                </button>
                <button className="btn btn-secondary" onClick={stopCamera}>Cancel</button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={startCamera}
              disabled={!selectedEmp}
            >
              <Video size={16} />
              <span>Open Camera & {mode === 'checkin' ? 'Check In' : 'Check Out'}</span>
            </button>
          )}

          {/* Result */}
          {result && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10, fontSize: 14,
              background: result.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${result.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: result.success ? 'var(--accent-green)' : '#f87171',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {result.success ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        {/* Right: Today's records */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={18} style={{ color: 'var(--primary)' }} />
            <span>Today's Records</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {employees.map(emp => {
              const rec = todayMap.get(emp.id);
              const isDone = rec?.check_in && rec?.check_out;
              const isIn = rec?.check_in && !rec?.check_out;
              return (
                <div key={emp.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, background: 'var(--bg-input)',
                  border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : isIn ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
                }}>
                  <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                    {getInitials(emp.full_name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {rec?.check_in ? `In: ${new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Not checked in'}
                      {rec?.check_out ? ` · Out: ${new Date(rec.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {rec?.verified && (
                      <span style={{ fontSize: 10, color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <ShieldCheck size={11} />
                        <span>{Math.round((rec.confidence || 0) * 100)}%</span>
                      </span>
                    )}
                    <span className={`badge ${isDone ? 'badge-success' : isIn ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: 10 }}>
                      {isDone ? 'Done' : isIn ? 'In' : 'Absent'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
