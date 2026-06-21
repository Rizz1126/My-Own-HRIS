import { pgTable, text, timestamp, boolean, varchar, integer, uuid, date, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- BETTER AUTH SCHEMA ---

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: varchar('role', { length: 50 }).notNull().default('Employee'), // Admin, HR, Employee
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  expiresAt: timestamp('expiresAt'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// --- MASTER DATA ---

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  colorCode: varchar('color_code', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const employees = pgTable('employees', {
  id: varchar('id', { length: 50 }).primaryKey(), // EMP-0001
  userId: text('user_id').references(() => users.id), // Link to auth
  name: varchar('name', { length: 255 }).notNull().default(''),
  email: varchar('email', { length: 255 }).notNull().default(''),
  nik: varchar('nik', { length: 50 }),
  npwp: varchar('npwp', { length: 50 }),
  position: varchar('position', { length: 100 }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  level: varchar('level', { length: 50 }),
  status: varchar('status', { length: 50 }).default('Active'),
  joinDate: date('join_date').notNull(),
  exitDate: date('exit_date'),
  baseSalary: integer('base_salary').notNull(),
  bankAccountNumber: varchar('bank_account_number', { length: 50 }),
  bankName: varchar('bank_name', { length: 50 }),
  bio: text('bio'),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  dateOfBirth: date('date_of_birth'),
  emergencyContact: varchar('emergency_contact', { length: 255 }),
  emergencyPhone: varchar('emergency_phone', { length: 20 }),
  skills: text('skills'), // JSON string
  maritalStatus: varchar('marital_status', { length: 50 }).default('TK/0'),
  dependents: integer('dependents').default(0),
  active: boolean('active').default(true),
  extendPlan: boolean('extend_plan').default(false),
  sendPayslip: boolean('send_payslip').default(false),
  bankAccountName: varchar('bank_account_name', { length: 255 }),
  bankRemark: text('bank_remark'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  type: varchar('type', { length: 50 }).notNull(), // PKWT, PKWTT, Internship
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  documentUrl: text('document_url'),
});

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  industry: varchar('industry', { length: 100 }),
  contactPerson: varchar('contact_person', { length: 100 }),
  active: boolean('active').default(true),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  clientId: uuid('client_id').references(() => clients.id),
  status: varchar('status', { length: 50 }).default('Active'),
  startDate: date('start_date'),
  endDate: date('end_date'),
});

export const assignments = pgTable('assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  projectId: uuid('project_id').references(() => projects.id),
  departmentId: uuid('department_id').references(() => departments.id),
  role: varchar('role', { length: 255 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  allocation: integer('allocation').default(100),
  active: boolean('active').default(true),
});


// --- TIME & ATTENDANCE ---

export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(), // e.g. 08:00
  endTime: varchar('end_time', { length: 10 }).notNull(),
  color: varchar('color', { length: 20 }),
});

export const employeeSchedules = pgTable('employee_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  shiftId: uuid('shift_id').notNull().references(() => shifts.id),
  date: date('date').notNull(),
});

export const attendances = pgTable('attendances', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  date: date('date').notNull(),
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  status: varchar('status', { length: 50 }).notNull(), // Present, Late, Absent, Leave
});

export const leaveRequests = pgTable('leave_requests', {
  id: varchar('id', { length: 50 }).primaryKey(), // LV-0001
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  type: varchar('type', { length: 50 }).notNull(), // Annual Leave, Sick Leave, etc.
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: varchar('status', { length: 50 }).default('Pending'), // Pending, Approved, Rejected
  reason: text('reason'),
});

export const overtimeRequests = pgTable('overtime_requests', {
  id: varchar('id', { length: 50 }).primaryKey(), // OVT-0001
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  date: date('date').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  hours: numeric('hours').notNull(),
  task: text('task').notNull(),
  achievement: varchar('achievement', { length: 100 }).notNull(), // Completed, On Progress, Failed
  progressDetails: text('progress_details'),
  evidenceUrl: text('evidence_url'),
  status: varchar('status', { length: 50 }).default('Approved'), // Approved automatically for now as requested
  isWeekend: boolean('is_weekend').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const overtimeBatches = pgTable('overtime_batches', {
  id: varchar('id', { length: 50 }).primaryKey(), // BATCH-001
  period: varchar('period', { length: 100 }).notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: varchar('status', { length: 50 }).default('Draft'), // Draft, Processed
  paymentDate: date('payment_date'),
});

// --- TALENT MANAGEMENT ---

export const jobOpenings = pgTable('job_openings', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  type: varchar('type', { length: 50 }),
  location: varchar('location', { length: 100 }),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('Open'),
  picId: varchar('pic_id', { length: 50 }).references(() => employees.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const candidates = pgTable('candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobOpenings.id),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  stage: varchar('stage', { length: 50 }).default('Applied'), // Applied, Screening, Interview, Offered, Hired
  rating: numeric('rating'),
  cvUrl: text('cv_url'),
  hrApproval: boolean('hr_approval').default(false),
  managerApproval: boolean('manager_approval').default(false),
  appliedDate: timestamp('applied_date').notNull().defaultNow(),
});

export const onboardingTasks = pgTable('onboarding_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  candidateId: uuid('candidate_id'), // optional link to source candidate
  title: varchar('title', { length: 255 }).notNull(),
  isCompleted: boolean('is_completed').default(false),
});

export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  period: varchar('period', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).default('Pending'), // Pending, Completed
  overallScore: numeric('overall_score'),
  managerId: varchar('manager_id', { length: 50 }),
  peerId: varchar('peer_id', { length: 50 }),
  instrument: varchar('instrument', { length: 100 }).default('360 Evaluation'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const assessmentScores = pgTable('assessment_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id),
  competency: varchar('competency', { length: 255 }).notNull(),
  selfScore: numeric('self_score').default('0'),
  managerScore: numeric('manager_score').default('0'),
  peerScore: numeric('peer_score').default('0'),
});

export const careerTracks = pgTable('career_tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
});

export const careerLevels = pgTable('career_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackId: uuid('track_id').notNull().references(() => careerTracks.id),
  level: integer('level').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  minYears: integer('min_years').default(0),
  salaryRange: varchar('salary_range', { length: 100 }),
  requirements: text('requirements'), // JSON or comma separated
});

export const employeeCareerProgress = pgTable('employee_career_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  trackId: uuid('track_id').notNull().references(() => careerTracks.id),
  currentLevel: integer('current_level').default(1),
  readiness: integer('readiness').default(0), // 0-100
  yearsInRole: numeric('years_in_role').default('0'),
});

// --- PAYROLL ---

export const payslips = pgTable('payslips', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  periodMonth: integer('period_month').notNull(),
  periodYear: integer('period_year').notNull(),
  baseSalary: integer('base_salary').notNull(),
  allowancesTotal: integer('allowances_total').notNull(),
  deductionsTotal: integer('deductions_total').notNull(),
  netPay: integer('net_pay').notNull(),
  status: varchar('status', { length: 50 }).default('Draft'), // Draft, Paid
});

// --- ESS ---

export const reimbursements = pgTable('reimbursements', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id),
  title: varchar('title', { length: 255 }).notNull(),
  amount: integer('amount').notNull(),
  type: varchar('type', { length: 100 }).notNull(), // Health, Transport, Travel, Other
  status: varchar('status', { length: 50 }).default('Pending'), // Pending, Approved, Rejected, Paid
  requestDate: timestamp('request_date').notNull().defaultNow(),
  receiptUrl: text('receipt_url'),
  description: text('description'),
});

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  priority: varchar('priority', { length: 50 }).default('Normal'), // High, Normal, Low
  createdBy: varchar('created_by', { length: 50 }).references(() => employees.id), // Employee ID of creator
  createdAt: timestamp('created_at').notNull().defaultNow(),
  isActive: boolean('is_active').default(true),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // 'profile_update', 'leave_request', etc
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  targetRole: varchar('target_role', { length: 50 }), // 'Admin', 'HR'
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// --- OKR / GOALS ---

export const objectives = pgTable('objectives', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  level: varchar('level', { length: 20 }).notNull(),       // 'company' | 'department' | 'individual'
  period: varchar('period', { length: 50 }).notNull(),      // 'Q1 2026', 'Q2 2026', etc
  status: varchar('status', { length: 30 }).default('Draft'),  // Draft, Active, Completed, Cancelled
  progress: numeric('progress').default('0'),               // 0.0 - 1.0 (auto-calculated)

  // Ownership
  ownerId: varchar('owner_id', { length: 50 }).references(() => employees.id),
  departmentId: uuid('department_id').references(() => departments.id),

  // Alignment (cascading) — self-referencing
  parentObjectiveId: uuid('parent_objective_id'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const keyResults = pgTable('key_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  objectiveId: uuid('objective_id').notNull().references(() => objectives.id),
  metricName: varchar('metric_name', { length: 500 }).notNull(),
  unit: varchar('unit', { length: 50 }).default(''),        // '%', 'IDR', 'count', 'score'
  initialValue: numeric('initial_value').default('0'),
  targetValue: numeric('target_value').notNull(),
  currentValue: numeric('current_value').default('0'),
  weight: numeric('weight').default('1'),                    // relative weight between KRs
  confidence: varchar('confidence', { length: 20 }).default('On Track'), // On Track, At Risk, Off Track
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const okrCheckIns = pgTable('okr_check_ins', {
  id: uuid('id').primaryKey().defaultRandom(),
  keyResultId: uuid('key_result_id').notNull().references(() => keyResults.id),
  value: numeric('value').notNull(),
  comment: text('comment'),
  confidence: varchar('confidence', { length: 20 }).default('On Track'),
  createdBy: varchar('created_by', { length: 50 }).references(() => employees.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const okrAlignments = pgTable('okr_alignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  childObjectiveId: uuid('child_objective_id').notNull().references(() => objectives.id),
  parentObjectiveId: uuid('parent_objective_id').notNull().references(() => objectives.id),
});

// Relations can be defined here...

