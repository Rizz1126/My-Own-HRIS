import {
  Home, LayoutDashboard, Users, Clock, Wallet, Target, Smartphone, BarChart3,
  Building2, FileText, ScrollText, CalendarDays, CalendarClock, Timer,
  Calculator, Receipt, Shield, FileSpreadsheet, UserPlus, ClipboardList,
  Star, TrendingUp, CalendarOff, CreditCard, User, PieChart, Grid3X3, DollarSign,
  Database, Briefcase, FolderKanban, Building, BarChart2, Settings, CalendarCheck, CheckSquare,
  AlarmClock, TreePalm, ShieldCheck
} from 'lucide-react';

export const NAV_ITEMS = [
  {
    id: 'lounge',
    label: 'Lounge',
    icon: Home,
    path: '/',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    requiredRole: 'Admin',
  },
  {
    id: 'master-data',
    label: 'Master Data',
    icon: Database,
    children: [
      { id: 'employees', label: 'Employees', path: '/master-data/employees', icon: Users },
      { id: 'contracts', label: 'Contracts', path: '/master-data/contracts', icon: ScrollText },
      { id: 'assignments', label: 'Assignments', path: '/master-data/assignments', icon: Briefcase },
      { id: 'projects', label: 'Projects', path: '/master-data/projects', icon: FolderKanban },
      { id: 'clients', label: 'Clients', path: '/master-data/clients', icon: Building },
      { id: 'organization', label: 'Organization', path: '/master-data/organization', icon: Building2 },
      { id: 'documents', label: 'Documents', path: '/master-data/documents', icon: FileText },
    ],
  },

  {
    id: 'overtime',
    label: 'Overtime',
    icon: AlarmClock,
    children: [
      { id: 'my-overtime', label: 'My Overtime', path: '/attendance/my-overtime', icon: Timer },
      { id: 'overtime-request', label: 'Overtime Request', path: '/attendance/overtime', icon: Clock },
      { id: 'overtime-stats', label: 'Overtime Statistics', path: '/attendance/overtime-stats', icon: BarChart2 },
      { id: 'overtime-processing', label: 'Overtime Processing', path: '/attendance/overtime-processing', icon: Settings },
    ],
  },
  {
    id: 'leave',
    label: 'Leave',
    icon: TreePalm,
    children: [
      { id: 'leave-my', label: 'My Leave', path: '/attendance/my-leave', icon: CalendarOff },
      { id: 'leave-calendar', label: 'Leave Calendar', path: '/attendance/leave-calendar', icon: CalendarCheck },
      { id: 'leave-approval', label: 'Leave Approval', path: '/attendance/leave-approval', icon: CheckSquare },
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: Wallet,
    children: [
      { id: 'calculation', label: 'Salary Calculation', path: '/payroll/calculation', icon: Calculator },
      { id: 'tax', label: 'PPh 21 (Tax)', path: '/payroll/tax', icon: Receipt },
      { id: 'bpjs', label: 'BPJS', path: '/payroll/bpjs', icon: Shield },
      { id: 'payslips', label: 'Payslips', path: '/payroll/payslips', icon: FileSpreadsheet },
    ],
  },
  {
    id: 'talent',
    label: 'Talent Management',
    icon: Target,
    children: [
      { id: 'recruitment', label: 'Recruitment (ATS)', path: '/talent/recruitment', icon: UserPlus },
      { id: 'recruitment-analytics', label: 'Recruitment Analytics', path: '/talent/recruitment-analytics', icon: BarChart2 },
      { id: 'onboarding', label: 'Onboarding', path: '/talent/onboarding', icon: ClipboardList },
      { id: 'assessment', label: 'Assessment', path: '/talent/assessment', icon: Star },
      { id: 'career-path', label: 'Career Path', path: '/talent/career-path', icon: TrendingUp },
      { id: 'okr', label: 'OKR Management', path: '/talent/okr', icon: Target },
    ],
  },
  {
    id: 'ess',
    label: 'Self-Service',
    icon: Smartphone,
    children: [
      { id: 'my-attendance', label: 'My Attendance', path: '/ess/my-attendance', icon: Clock },
      { id: 'my-payslips', label: 'My Payslips', path: '/ess/my-payslips', icon: Receipt },
      { id: 'reimbursement', label: 'Reimbursement', path: '/ess/reimbursement', icon: CreditCard },
      { id: 'my-assessments', label: 'My Assessments', path: '/ess/my-assessments', icon: Star },
      { id: 'my-okr', label: 'My OKR', path: '/ess/my-okr', icon: Target },
      { id: 'my-profile', label: 'My Profile', path: '/ess/my-profile', icon: User },
    ],
  },
  {
    id: 'analytics',
    label: 'People Analytics',
    icon: BarChart3,
    children: [
      { id: 'turnover', label: 'Turnover', path: '/analytics/turnover', icon: PieChart },
      { id: 'attendance-heatmap', label: 'Attendance Heatmap', path: '/analytics/attendance-heatmap', icon: Grid3X3 },
      { id: 'cost-prediction', label: 'Cost Prediction', path: '/analytics/cost-prediction', icon: DollarSign },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: ShieldCheck,
    requiredRole: 'Admin',
    children: [
      { id: 'user-management', label: 'User Management', path: '/admin/user-management', icon: Users },
    ],
  },
];

export const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Finance', 'HR', 'Operations', 'Sales'];

export const CONTRACT_TYPES = ['PKWT', 'PKWTT'];

export const EMPLOYMENT_STATUSES = ['Contract Fulltime', 'Contract Part-time', 'Internship', 'Permanent'];

export const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Paternity Leave'];

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

// Menu IDs each role can access (Includes both Parent and Child Submenus)
const ALL_MODULES = ['lounge', 'dashboard', 'master-data', 'employees', 'contracts', 'assignments', 'projects', 'clients', 'organization', 'documents', 'attendance', 'presence', 'shifts', 'overtime', 'my-overtime', 'overtime-request', 'overtime-stats', 'overtime-processing', 'leave', 'leave-my', 'leave-calendar', 'leave-approval', 'payroll', 'calculation', 'tax', 'bpjs', 'payslips', 'talent', 'recruitment', 'recruitment-analytics', 'onboarding', 'assessment', 'career-path', 'okr', 'ess', 'my-attendance', 'my-payslips', 'reimbursement', 'my-profile', 'my-okr', 'analytics', 'turnover', 'attendance-heatmap', 'cost-prediction', 'admin', 'user-management'];

export const ROLE_PERMISSIONS = {
  'Super Admin': [...ALL_MODULES],
  'Admin': [...ALL_MODULES],
  'Employee': ['lounge', 'overtime', 'my-overtime', 'overtime-request', 'leave', 'leave-my', 'ess', 'my-attendance', 'my-payslips', 'reimbursement', 'my-assessments', 'my-okr', 'my-profile'],
};

export const STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  EXPIRING: 'Expiring Soon',
  EXPIRED: 'Expired',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const ROOM_STATUSES = [
  { id: 'working', label: 'Working', emoji: '💻', color: '#6366F1' },
  { id: 'meeting', label: 'Meeting', emoji: '🤝', color: '#F59E0B' },
  { id: 'break', label: 'Break', emoji: '☕', color: '#10B981' },
];

export const KANBAN_STAGES = ['Applied', 'Screening', 'Interview', 'Offered', 'Hired'];


