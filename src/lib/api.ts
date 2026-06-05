/* API client for communicating with FastAPI backend */

export const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE = isLocalhost 
  ? 'http://127.0.0.1:8000/api' 
  : 'https://hrm-backend-dtxm.onrender.com/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  console.log("Fetching URL:", url);
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

function uploadRequest(endpoint: string, formData: FormData) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
  return fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(r => r.json());
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getDemoUsers: () => request('/auth/demo-users'),
  switchRole: (userId: number) =>
    request(`/auth/switch-role/${userId}`, { method: 'POST' }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),
  getDepartmentStats: () => request('/dashboard/department-stats'),
  getHiringFunnel: () => request('/dashboard/hiring-funnel'),
  getRecentActivity: () => request('/dashboard/recent-activity'),

  // Jobs
  getJobs: (params?: string) => request(`/jobs/${params ? `?${params}` : ''}`),
  getJob: (id: number) => request(`/jobs/${id}`),
  createJob: (data: any) => request('/jobs/', { method: 'POST', body: JSON.stringify(data) }),
  updateJob: (id: number, data: any) => request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJob: (id: number) => request(`/jobs/${id}`, { method: 'DELETE' }),

  // Candidates & Applications
  getCandidates: (search?: string) => request(`/candidates/${search ? `?search=${search}` : ''}`),
  createCandidate: (data: any) => request('/candidates/', { method: 'POST', body: JSON.stringify(data) }),
  getApplications: (params?: string) => request(`/candidates/applications/all${params ? `?${params}` : ''}`),
  createApplication: (data: any) => request('/candidates/applications/', { method: 'POST', body: JSON.stringify(data) }),
  updateApplication: (id: number, data: any) => request(`/candidates/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendOffer: (appId: number, data: { ctc: number; joining_date: string; probation_months?: number; valid_until: string }) =>
    request<any>(`/candidates/applications/${appId}/send-offer`, { method: 'POST', body: JSON.stringify(data) }),
  deleteApplication: (id: number) => request<any>(`/candidates/applications/${id}`, { method: 'DELETE' }),
  getPipeline: () => request('/candidates/applications/pipeline'),

  // Interviews
  getInterviews: (params?: string) => request(`/interviews/${params ? `?${params}` : ''}`),
  scheduleInterview: (data: any) => request('/interviews/', { method: 'POST', body: JSON.stringify(data) }),
  updateInterview: (id: number, data: any) => request(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  runAiInterview: (id: number) => request(`/interviews/${id}/ai-interview`, { method: 'POST' }),
  startInterviewSession: (id: number) => request(`/interviews/${id}/start-session`, { method: 'POST' }),
  evaluateAnswer: (data: any) => request('/interviews/evaluate-answer', { method: 'POST', body: JSON.stringify(data) }),
  finalEvaluation: (data: any) => request('/interviews/final-evaluation', { method: 'POST', body: JSON.stringify(data) }),

  // Employees
  getEmployees: (params?: string) => request(`/employees/${params ? `?${params}` : ''}`),
  getEmployee: (id: number) => request(`/employees/${id}`),
  createEmployee: (data: any) => request('/employees/', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: number, data: any) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getDepartments: () => request('/employees/departments/all'),
  getOrgChart: () => request('/employees/org-chart'),
  getEmployeeTimeline: (id: number) => request(`/employees/${id}/timeline`),

  // Attendance & Leaves
  checkIn: (employeeId: number, latitude?: number, longitude?: number, imageBase64?: string) => request('/attendance/check-in', { method: 'POST', body: JSON.stringify({ employee_id: employeeId, latitude, longitude, image_base_64: imageBase64, image_base64: imageBase64 }) }),
  checkOut: (employeeId: number, latitude?: number, longitude?: number, imageBase64?: string) => request('/attendance/check-out', { method: 'POST', body: JSON.stringify({ employee_id: employeeId, latitude, longitude, image_base_64: imageBase64, image_base64: imageBase64 }) }),
  getAttendance: (params?: string) => request(`/attendance/records${params ? `?${params}` : ''}`),
  getLeaves: (params?: string) => request(`/attendance/leaves/${params ? `?${params}` : ''}`),
  applyLeave: (data: any) => request('/attendance/leaves/', { method: 'POST', body: JSON.stringify(data) }),
  updateLeave: (id: number, data: any) => request(`/attendance/leaves/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLeaveBalance: (employeeId: number) => request(`/attendance/leaves/balance/${employeeId}`),
  getHolidays: () => request('/attendance/holidays/'),
  createHoliday: (data: { name: string; date: string; type?: string }) => request<any>('/attendance/holidays/', { method: 'POST', body: JSON.stringify(data) }),
  updateHoliday: (id: number, data: { name?: string; date?: string; type?: string }) => request<any>(`/attendance/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getGeofence: () => request('/attendance/geofence'),
  updateGeofence: (latitude: number, longitude: number, radius: number = 100.0) => request('/attendance/geofence/update', { method: 'POST', body: JSON.stringify({ latitude, longitude, radius }) }),
  
  // Comp-off
  getCompOffRule: () => request<any>('/attendance/compoff/rule'),
  updateCompOffRule: (data: { standard_working_hours?: number; min_overtime_hours?: number }) =>
    request<any>('/attendance/compoff/rule', { method: 'PUT', body: JSON.stringify(data) }),
  getEligibleOvertimeDates: () => request<any[]>('/attendance/compoff/eligible-dates'),
  createCompOffRequest: (data: { attendance_date: string; reason?: string }) =>
    request<any>('/attendance/compoff/request', { method: 'POST', body: JSON.stringify(data) }),
  getMyCompOffRequests: () => request<any[]>('/attendance/compoff/my-requests'),
  getPendingCompOffApprovals: () => request<any[]>('/attendance/compoff/pending-approvals'),
  actionCompOffRequest: (id: number, action: 'approve' | 'reject') =>
    request<any>(`/attendance/compoff/action/${id}`, { method: 'POST', body: JSON.stringify({ action }) }),
  cancelCompOffRequest: (id: number) =>
    request<any>(`/attendance/compoff/cancel/${id}`, { method: 'POST' }),

  // Payroll
  getPayrollRuns: () => request('/payroll/runs'),
  runPayroll: (month: number, year: number) => request('/payroll/run', { method: 'POST', body: JSON.stringify({ month, year }) }),
  getEmployeePayslips: (employeeId: number) => request(`/payroll/payslips/${employeeId}`),
  downloadPayslip: (payslipId: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
    return `${API_BASE}/payroll/payslips/${payslipId}/download${token ? `?token=${token}` : ''}`;
  },

  // Performance
  getReviews: (employeeId?: number) => request(`/performance/reviews${employeeId ? `?employee_id=${employeeId}` : ''}`),
  createReview: (data: any) => request('/performance/reviews', { method: 'POST', body: JSON.stringify(data) }),
  updateReview: (id: number, data: any) => request(`/performance/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getGoals: (employeeId?: number) => request(`/performance/goals${employeeId ? `?employee_id=${employeeId}` : ''}`),
  createGoal: (data: any) => request('/performance/goals', { method: 'POST', body: JSON.stringify(data) }),
  submit360Feedback: (reviewId: number, data: any) =>
    request(`/performance/reviews/${reviewId}/peer-feedback`, { method: 'POST', body: JSON.stringify(data) }),
  submitSelfReview: (reviewId: number, selfReview: string) =>
    request(`/performance/reviews/${reviewId}/self-review`, { method: 'POST', body: JSON.stringify({ review_id: reviewId, self_review: selfReview }) }),
  get360Summary: (reviewId: number) => request(`/performance/reviews/${reviewId}/360-summary`),

  // AI Copilot & Intelligence
  aiChat: (message: string) =>
    request('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  queryDocs: (query: string) =>
    request<any>('/ai/query-docs', { method: 'POST', body: JSON.stringify({ query }) }),
  generateJD: (data: any) =>
    request('/ai/generate-jd', { method: 'POST', body: JSON.stringify(data) }),
  getAttritionRisk: () => request('/ai/attrition-risk'),
  writeReview: (data: any) =>
    request('/ai/write-review', { method: 'POST', body: JSON.stringify(data) }),
  generateJDForJob: (jobId: number) =>
    request(`/jobs/generate-jd?job_id=${jobId}`, { method: 'POST' }),
  parseResume: (formData: FormData) =>
    uploadRequest('/resume/parse', formData),
  parseAndCreateCandidate: (formData: FormData, jobId?: string) =>
    uploadRequest(`/resume/parse-and-create${jobId ? `?job_id=${jobId}` : ''}`, formData),

  // Documents
  getDocuments: (params?: string) => request(`/documents/${params ? `?${params}` : ''}`),
  uploadDocument: (formData: FormData) => uploadRequest('/documents/upload', formData),
  downloadDocument: (id: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null;
    return `${API_BASE}/documents/${id}/download${token ? `?token=${token}` : ''}`;
  },
  deleteDocument: (id: number) => request(`/documents/${id}`, { method: 'DELETE' }),
  getDocumentStats: () => request('/documents/stats/summary'),

  // Search & Notifications
  unifiedSearch: (q: string) => request<any>(`/search/?q=${encodeURIComponent(q)}`),
  getNotifications: (userId: number, limit?: number) => request<any>(`/notifications/?user_id=${userId}${limit ? `&limit=${limit}` : ''}`),
  getUnreadNotificationCount: (userId: number) => request<any>(`/notifications/unread-count?user_id=${userId}`),
  markNotificationRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: (userId: number) => request<any>(`/notifications/read-all?user_id=${userId}`, { method: 'PUT' }),

  // Corporate Activities & Event Planner
  getActivities: (category?: string) => request<any>(`/activities/${category ? `?category=${category}` : ''}`),
  createActivity: (data: any) => request<any>('/activities/', { method: 'POST', body: JSON.stringify(data) }),
  deleteActivity: (id: number) => request<any>(`/activities/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: (params?: string) => request(`/expenses/${params ? `?${params}` : ''}`),
  createExpense: (data: any) => request('/expenses/', { method: 'POST', body: JSON.stringify(data) }),
  actionExpense: (id: number, data: any) => request(`/expenses/${id}/action`, { method: 'PUT', body: JSON.stringify(data) }),
  getExpenseStats: () => request('/expenses/stats/summary'),
  uploadReceipt: (expenseId: number, formData: FormData) => uploadRequest(`/expenses/${expenseId}/receipt`, formData),

  // Face Attendance
  faceCheckIn: (data: any) => request('/face-attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
  faceCheckOut: (data: any) => request('/face-attendance/check-out', { method: 'POST', body: JSON.stringify(data) }),
  getFaceTodayRecords: () => request('/face-attendance/today'),

  // Salary Benchmarking
  getSalaryBenchmarking: () => request('/benchmarking/'),
  getBenchmarkingSummary: () => request('/benchmarking/summary'),

  // Offboarding
  getResignations: () => request('/offboarding/resignations'),
  submitResignation: (data: any) => request('/offboarding/resignations', { method: 'POST', body: JSON.stringify(data) }),
  updateResignation: (id: number, data: any) => request(`/offboarding/resignations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  calculateSettlement: (id: number) => request(`/offboarding/resignations/${id}/calculate-settlement`, { method: 'POST' }),
  generateExperienceLetter: (id: number) => `${API_BASE}/offboarding/resignations/${id}/generate-experience-letter`,
  generateRelievingLetter: (id: number) => `${API_BASE}/offboarding/resignations/${id}/generate-relieving-letter`,

  // Password Management
  changePassword: (data: any) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPasswordAdmin: (userId: number) => request(`/auth/reset-password-admin/${userId}`, { method: 'POST' }),
};
