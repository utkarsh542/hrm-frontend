'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Employee, AttendanceRecord } from '@/types';
import { getInitials, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { useRole } from '@/lib/useRole';
import { Calendar, UserCheck, UserMinus, Clock, Users, History, SlidersHorizontal, Info, MapPin, Camera } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const YEARS = [2026, 2025, 2024];

export default function AttendancePage() {
  const { isAdminHROrManager, email } = useRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Face Scan modal & verify state variables
  const [showFaceScanModal, setShowFaceScanModal] = useState(false);
  const [scanMode, setScanMode] = useState<'checkin' | 'checkout'>('checkin');
  const [scanEmployeeId, setScanEmployeeId] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Dynamic Geofence active settings
  const [activeGeofence, setActiveGeofence] = useState<any>(null);
  const [syncingGeofence, setSyncingGeofence] = useState(false);
  const [showLocationBypass, setShowLocationBypass] = useState(false);
  const [bypassCoordinates, setBypassCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const fetchData = async (m: number, y: number) => {
    setLoading(true);
    try {
      const [emps, recs, geo]: any = await Promise.all([
        api.getEmployees(),
        api.getAttendance(`month=${m}&year=${y}`),
        api.getGeofence().catch(() => null),
      ]);
      setEmployees((emps as Employee[]).filter(e => e.is_active));
      setRecords(recs as AttendanceRecord[]);
      if (geo) setActiveGeofence(geo);
      setRecords(recs as AttendanceRecord[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedMonth, selectedYear);
  }, []);

  const handleMonthChange = (m: number) => {
    setSelectedMonth(m);
    fetchData(m, selectedYear);
  };

  const handleYearChange = (y: number) => {
    setSelectedYear(y);
    fetchData(selectedMonth, y);
  };

  // Build today's record map
  const todayRecords = new Map<number, AttendanceRecord>();
  records.forEach(r => {
    if (r.date === todayStr) todayRecords.set(r.employee_id, r);
  });

  // Filtered records for History Tab
  const filteredRecords = records.filter(r => {
    const matchesEmployee = selectedEmployeeId === 'all' || r.employee_id === Number(selectedEmployeeId);
    const matchesStatus = selectedStatus === 'all' || r.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesEmployee && matchesStatus;
  });

  // Employees only see themselves; admin/hr/manager see all
  const displayEmployees = isAdminHROrManager ? employees : employees.filter(e => e.email === email);

  const getCurrentCoordinates = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Your browser does not support Geolocation."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  };

  // Trigger webcam face scanner
  const triggerFaceScan = async (empId: number, mode: 'checkin' | 'checkout') => {
    setScanEmployeeId(empId);
    setScanMode(mode);
    setScanResult(null);
    setShowFaceScanModal(true);
    setScanning(false);
    setShowLocationBypass(false);
    setBypassCoordinates(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 150);
    } catch {
      setScanResult({ success: false, message: 'Webcam access denied. Please verify camera connections & permissions.' });
    }
  };

  const closeFaceScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowFaceScanModal(false);
    setScanEmployeeId(null);
    setScanResult(null);
    setShowLocationBypass(false);
    setBypassCoordinates(null);
  };

  const executeFaceCheck = async (useBypass = false) => {
    if (!scanEmployeeId || !videoRef.current || !canvasRef.current) return;
    setScanning(true);
    setScanResult(null);
    setShowLocationBypass(false);
    try {
      let latitude: number;
      let longitude: number;

      if (useBypass && bypassCoordinates) {
        latitude = bypassCoordinates.latitude;
        longitude = bypassCoordinates.longitude;
      } else {
        try {
          const position = await getCurrentCoordinates();
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (geoError: any) {
          // Store office coordinates for bypass
          const lat = activeGeofence?.latitude || 12.9716;
          const lon = activeGeofence?.longitude || 77.5946;
          setBypassCoordinates({ latitude: lat, longitude: lon });
          setShowLocationBypass(true);
          throw new Error("Location permission denied or unavailable. Geolocation is mandatory for verification.");
        }
      }

      // 2. Capture Frame from Video
      const canvas = canvasRef.current;
      canvas.width = 320;
      canvas.height = 240;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 320, 240);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];

      // 3. Post to API
      let res: any;
      if (scanMode === 'checkin') {
        res = await api.checkIn(scanEmployeeId, latitude, longitude, imageBase64);
      } else {
        res = await api.checkOut(scanEmployeeId, latitude, longitude, imageBase64);
      }

      setScanResult({ success: true, message: res.message || "Face matched & verified!" });
      
      // Keep modal open briefly to show premium success animation
      setTimeout(() => {
        closeFaceScan();
        fetchData(selectedMonth, selectedYear);
      }, 1500);

    } catch (e: any) {
      setScanResult({ success: false, message: e.message || "Verification failed" });
    } finally {
      setScanning(false);
    }
  };

  const handleCheckIn = (empId: number) => {
    triggerFaceScan(empId, 'checkin');
  };

  const handleCheckOut = (empId: number) => {
    triggerFaceScan(empId, 'checkout');
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  const checkedInCount = Array.from(todayRecords.values()).filter(r => r.check_in && !r.check_out).length;
  const checkedOutCount = Array.from(todayRecords.values()).filter(r => r.check_in && r.check_out).length;
  const todayLabel = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const tabStyle = (tabId: 'today' | 'history') => ({
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700 as const,
    background: activeTab === tabId ? 'var(--primary)' : 'var(--bg-input)',
    color: activeTab === tabId ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            <Calendar size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Attendance</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginTop: 4 }}>
              {activeTab === 'today' ? todayLabel : 'Track employee check-ins and hours historically'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabStyle('today')} onClick={() => setActiveTab('today')}>
          <Calendar size={15} /> Daily Status
        </button>
        <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
          <History size={15} /> Attendance History
        </button>
      </div>

      {activeTab === 'today' && (
        <>
          {isAdminHROrManager && (
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={18} strokeWidth={2} />
                </div>
                <div className="stat-info">
                  <div className="stat-label">Checked In</div>
                  <div className="stat-value">{checkedInCount}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserMinus size={18} strokeWidth={2} />
                </div>
                <div className="stat-info">
                  <div className="stat-label">Checked Out</div>
                  <div className="stat-value">{checkedOutCount}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} strokeWidth={2} />
                </div>
                <div className="stat-info">
                  <div className="stat-label">Not Yet</div>
                  <div className="stat-value">{employees.length - checkedInCount - checkedOutCount}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} strokeWidth={2} />
                </div>
                <div className="stat-info">
                  <div className="stat-label">Total Active</div>
                  <div className="stat-value">{employees.length}</div>
                </div>
              </div>
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayEmployees.map(emp => {
                  const rec = todayRecords.get(emp.id);
                  const isIn = !!rec?.check_in && !rec?.check_out;
                  const isDone = !!rec?.check_in && !!rec?.check_out;
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                            {getInitials(emp.full_name)}
                          </div>
                          <span style={{ fontWeight: 600 }}>{emp.full_name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{emp.employee_id}</td>
                      <td>{emp.department_name}</td>
                      <td style={{ fontSize: 13 }}>
                        {rec?.check_in ? (
                          <div>
                            <div>{new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                            {rec.check_in_address && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--text-tertiary)', fontSize: 11 }}>
                                <MapPin size={11} style={{ color: 'var(--primary)' }} />
                                <span title={`${rec.check_in_address} (lat: ${rec.check_in_lat}, lon: ${rec.check_in_lon})`} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140, cursor: 'help' }}>
                                  {rec.check_in_district}, {rec.check_in_state}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {rec?.check_out ? (
                          <div>
                            <div>{new Date(rec.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                            {rec.check_out_address && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--text-tertiary)', fontSize: 11 }}>
                                <MapPin size={11} style={{ color: 'var(--accent-orange)' }} />
                                <span title={`${rec.check_out_address} (lat: ${rec.check_out_lat}, lon: ${rec.check_out_lon})`} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140, cursor: 'help' }}>
                                  {rec.check_out_district}, {rec.check_out_state}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {rec?.work_hours ? `${rec.work_hours}h` : '—'}
                      </td>
                      <td>
                        {isDone ? (
                          <span className="badge badge-success">Completed</span>
                        ) : isIn ? (
                          <span className="badge badge-warning">Checked In</span>
                        ) : (
                          <span className="badge badge-neutral">Absent</span>
                        )}
                      </td>
                      <td>
                        {!rec?.check_in ? (
                          <button className="btn btn-sm btn-success" onClick={() => handleCheckIn(emp.id)}>Check In</button>
                        ) : !rec?.check_out ? (
                          <button className="btn btn-sm btn-secondary" onClick={() => handleCheckOut(emp.id)}>Check Out</button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <>
          {/* Advanced Filters Panel */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <SlidersHorizontal size={13} /> Month
              </label>
              <select className="form-select" value={selectedMonth} onChange={e => handleMonthChange(Number(e.target.value))}>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Year</label>
              <select className="form-select" value={selectedYear} onChange={e => handleYearChange(Number(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {isAdminHROrManager && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Employee</label>
                <select className="form-select" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}>
                  <option value="all">All Employees</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="work_from_home">WFH</option>
              </select>
            </div>
          </div>

          {/* History Data Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {isAdminHROrManager && <th>Employee</th>}
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours Worked</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(rec.date)}</td>
                    {isAdminHROrManager && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontWeight: 600 }}>{rec.employee_name}</span>
                        </div>
                      </td>
                    )}
                    <td style={{ fontSize: 13 }}>
                      {rec.check_in ? (
                        <div>
                          <div>{new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                          {rec.check_in_address && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--text-tertiary)', fontSize: 11 }}>
                              <MapPin size={11} style={{ color: 'var(--primary)' }} />
                              <span title={`${rec.check_in_address} (lat: ${rec.check_in_lat}, lon: ${rec.check_in_lon})`} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140, cursor: 'help' }}>
                                {rec.check_in_district}, {rec.check_in_state}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {rec.check_out ? (
                        <div>
                          <div>{new Date(rec.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                          {rec.check_out_address && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--text-tertiary)', fontSize: 11 }}>
                              <MapPin size={11} style={{ color: 'var(--accent-orange)' }} />
                              <span title={`${rec.check_out_address} (lat: ${rec.check_out_lat}, lon: ${rec.check_out_lon})`} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140, cursor: 'help' }}>
                                {rec.check_out_district}, {rec.check_out_state}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {rec.work_hours ? `${rec.work_hours}h` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(rec.status)}`}>
                        {rec.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={isAdminHROrManager ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <Info size={24} style={{ color: 'var(--text-tertiary)' }} />
                        <span>No historical attendance records found for this period.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Integrated Face Verification webcam scanner modal */}
      {showFaceScanModal && (
        <div className="modal-overlay" onClick={closeFaceScan}>
          <div className="modal-content animate-scale-in" style={{ maxWidth: 420, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 18 }}>
                <Camera size={20} style={{ color: 'var(--primary)' }} />
                <span>Face Security Verification</span>
              </h2>
              <button className="modal-close" onClick={closeFaceScan}>✕</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 20px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Please align your face in the center of the camera scan frame to complete your <strong>{scanMode === 'checkin' ? 'Check-In' : 'Check-Out'}</strong>.
              </div>
              
              <div style={{ position: 'relative', width: 280, height: 210, margin: '0 auto', borderRadius: 20, overflow: 'hidden', border: '2px solid var(--border)', background: '#0a0a14' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {/* Circular face target scanning outline overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    width: 170,
                    height: 170,
                    borderRadius: '50%',
                    border: '2px dashed var(--primary-light)',
                    boxShadow: '0 0 0 9999px rgba(10, 10, 20, 0.45)'
                  }}></div>
                </div>
                
                {/* Biometrics scanning green horizontal line animation */}
                {scanning && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 3,
                    background: 'var(--accent-green)',
                    boxShadow: '0 0 10px var(--accent-green)',
                    animation: 'scannerLine 2s infinite ease-in-out',
                    top: 0
                  }} />
                )}
              </div>
              
              {/* Scan result display */}
              {scanResult && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontSize: 13,
                  background: scanResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${scanResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: scanResult.success ? 'var(--accent-green)' : '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}>
                  <span style={{ fontWeight: 600 }}>{scanResult.message}</span>
                </div>
              )}

              {showLocationBypass && (
                <button
                  type="button"
                  onClick={() => executeFaceCheck(true)}
                  style={{
                    width: '100%',
                    background: 'var(--primary-light)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    color: 'var(--primary-dark)',
                    fontWeight: 700,
                    padding: '12px 16px',
                    borderRadius: 12,
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  <MapPin size={15} />
                  <span>Use Mock Office Location (Dev Bypass)</span>
                </button>
              )}
            </div>
            
            <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => executeFaceCheck(false)}
                disabled={scanning || (scanResult?.success ?? false)}
                style={{ minWidth: 150 }}
              >
                {scanning ? 'Verifying Identity...' : scanResult?.success ? 'Success!' : 'Capture & Verify'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={closeFaceScan}
                disabled={scanning}
              >
                Cancel
              </button>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
              @keyframes scannerLine {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
            `}} />
          </div>
        </div>
      )}
    </div>
  );
}
