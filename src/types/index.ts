/* TypeScript interfaces matching backend schemas */

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  is_active: boolean;
  avatar_url?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  job_type: string;
  experience_min: number;
  experience_max: number;
  salary_min?: number;
  salary_max?: number;
  description: string;
  requirements?: string;
  skills?: string;
  status: string;
  openings: number;
  created_at: string;
  applications_count: number;
}

export interface Candidate {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  current_company?: string;
  current_designation?: string;
  experience_years: number;
  skills?: string;
  resume_url?: string;
  linkedin_url?: string;
  location?: string;
  expected_salary?: number;
  notice_period_days: number;
  created_at: string;
}

export interface Application {
  id: number;
  candidate_id: number;
  job_id: number;
  status: string;
  source: string;
  ai_score?: number;
  ai_summary?: string;
  notes?: string;
  applied_at: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
}

export interface Interview {
  id: number;
  application_id: number;
  candidate_id: number;
  job_id: number;
  interview_type: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  interviewer_name?: string;
  meeting_link?: string;
  ai_score?: number;
  ai_feedback?: string;
  technical_score?: number;
  communication_score?: number;
  cultural_fit_score?: number;
  overall_score?: number;
  recommendation?: string;
  feedback?: string;
  candidate_name: string;
  job_title: string;
  round_number?: number;
}

export interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  official_address?: string;
  corresponding_address?: string;
  department_id?: number;
  department_name: string;
  designation?: string;
  employment_type: string;
  employment_status: string;
  joining_date: string;
  ctc: number;
  casual_leave_balance: number;
  sick_leave_balance: number;
  earned_leave_balance: number;
  comp_off_balance?: number;
  onboarding_status: string;
  reporting_manager_id?: number;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  status: string;
  check_in?: string;
  check_out?: string;
  work_hours: number;
  employee_name: string;
  check_in_lat?: number;
  check_in_lon?: number;
  check_out_lat?: number;
  check_out_lon?: number;
  check_in_address?: string;
  check_out_address?: string;
  check_in_district?: string;
  check_in_state?: string;
  check_out_district?: string;
  check_out_state?: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason?: string;
  status: string;
  approved_by?: number;
  employee_name: string;
  created_at: string;
}

export interface PayrollRun {
  id: number;
  month: number;
  year: number;
  status: string;
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  processed_at?: string;
  payslips: Payslip[];
}

export interface Payslip {
  id: number;
  payroll_run_id: number;
  employee_id: number;
  month: number;
  year: number;
  basic_salary: number;
  hra: number;
  da: number;
  special_allowance: number;
  total_earnings: number;
  pf_employee: number;
  professional_tax: number;
  tds: number;
  total_deductions: number;
  net_salary: number;
  working_days: number;
  present_days: number;
  status: string;
  employee_name: string;
  employee_code: string;
  department: string;
  designation: string;
}

export interface PerformanceReview {
  id: number;
  employee_id: number;
  cycle: string;
  period?: string;
  status: string;
  technical_rating?: number;
  communication_rating?: number;
  leadership_rating?: number;
  teamwork_rating?: number;
  innovation_rating?: number;
  overall_rating?: number;
  self_review?: string;
  manager_review?: string;
  recommendation?: string;
  employee_name: string;
  created_at: string;
}

export interface Goal {
  id: number;
  employee_id: number;
  title: string;
  description?: string;
  target_date?: string;
  status: string;
  progress: number;
  priority: string;
}

export interface Resignation {
  id: number;
  employee_id: number;
  reason?: string;
  resignation_date: string;
  last_working_day?: string;
  notice_period_days: number;
  status: string;
  exit_interview_done: boolean;
  assets_returned: boolean;
  experience_letter_generated: boolean;
  relieving_letter_generated: boolean;
  fnf_generated: boolean;
  total_settlement: number;
  employee_name: string;
  employee_code: string;
  department: string;
  designation: string;
  created_at: string;
}

export interface DashboardStats {
  total_employees: number;
  active_employees: number;
  open_positions: number;
  total_applications: number;
  interviews_today: number;
  pending_leaves: number;
  pending_resignations: number;
  this_month_payroll: number;
  new_hires_this_month: number;
  attrition_rate: number;
  casual_leave_balance?: number;
  sick_leave_balance?: number;
  earned_leave_balance?: number;
  present_days_this_month?: number;
  work_hours_this_month?: number;
  active_goals_count?: number;
}

export interface HiringFunnelData {
  stage: string;
  count: number;
}

export interface DepartmentStats {
  name: string;
  count: number;
}

export interface RecentActivity {
  id: number;
  type: string;
  message: string;
  timestamp: string;
}

export type Pipeline = Record<string, Array<{
  id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_email: string;
  job_id: number;
  job_title: string;
  ai_score?: number;
  source: string;
  applied_at: string;
}>>;


export interface CompOffRule {
  id: number;
  standard_working_hours: number;
  min_overtime_hours: number;
  is_active: number;
}

export interface CompOffRequest {
  id: number;
  employee_id: number;
  attendance_date: string;
  working_hours: number;
  overtime_hours: number;
  reason?: string;
  manager_status: string;
  manager_id?: number;
  manager_action_at?: string;
  hr_status: string;
  hr_id?: number;
  hr_action_at?: string;
  status: string;
  created_at: string;
  employee_name?: string;
}

