import express from 'express';
import cors from 'cors';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { 
  employees, departments, contracts, projects, 
  assignments, clients, attendances, shifts, leaveRequests,
  overtimeRequests, payslips, users, jobOpenings, candidates, assessments,
  onboardingTasks, careerTracks, careerLevels, employeeCareerProgress,
  reimbursements, announcements, notifications, employeeSchedules
} from '../backend/src/db/schema';
import * as schema from '../backend/src/db/schema';

// Database setup
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Database connection string not found. Set POSTGRES_URL or DATABASE_URL.');
}
const queryClient = postgres(connectionString);
const db = drizzle(queryClient, { schema });

const app = express();

// CORS configuration - allow all origins for now
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HRIS API is running', timestamp: new Date().toISOString() });
});

// ============ EMPLOYEES ============
app.get('/api/employees', async (req, res) => {
  try {
    const result = await db.select().from(employees);
    res.json(result);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    const result = await db.select().from(employees).where(eq(employees.id, req.params.id));
    if (result.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const result = await db.insert(employees).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/employees/:id', async (req, res) => {
  try {
    const result = await db.update(employees).set(req.body).where(eq(employees.id, req.params.id)).returning();
    if (result.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ DEPARTMENTS ============
app.get('/api/master-data/departments', async (req, res) => {
  try {
    const result = await db.select().from(departments);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

app.post('/api/master-data/departments', async (req, res) => {
  try {
    const result = await db.insert(departments).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ CONTRACTS ============
app.get('/api/master-data/contracts', async (req, res) => {
  try {
    const result = await db.select().from(contracts);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

app.post('/api/master-data/contracts', async (req, res) => {
  try {
    const result = await db.insert(contracts).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ PROJECTS ============
app.get('/api/master-data/projects', async (req, res) => {
  try {
    const result = await db.select().from(projects);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/master-data/projects', async (req, res) => {
  try {
    const result = await db.insert(projects).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ CLIENTS ============
app.get('/api/master-data/clients', async (req, res) => {
  try {
    const result = await db.select().from(clients);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

app.post('/api/master-data/clients', async (req, res) => {
  try {
    const result = await db.insert(clients).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ASSIGNMENTS ============
app.get('/api/master-data/assignments', async (req, res) => {
  try {
    const result = await db.select().from(assignments);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

app.post('/api/master-data/assignments', async (req, res) => {
  try {
    const result = await db.insert(assignments).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ATTENDANCE ============
app.get('/api/attendance', async (req, res) => {
  try {
    const result = await db.select().from(attendances);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const result = await db.insert(attendances).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ SHIFTS ============
app.get('/api/attendance/shifts', async (req, res) => {
  try {
    const result = await db.select().from(shifts);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

app.post('/api/attendance/shifts', async (req, res) => {
  try {
    const result = await db.insert(shifts).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ EMPLOYEE SCHEDULES ============
app.get('/api/attendance/schedules', async (req, res) => {
  try {
    const result = await db.select().from(employeeSchedules);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

app.post('/api/attendance/schedules', async (req, res) => {
  try {
    const result = await db.insert(employeeSchedules).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ LEAVE REQUESTS ============
app.get('/api/attendance/leave', async (req, res) => {
  try {
    const result = await db.select().from(leaveRequests);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

app.post('/api/attendance/leave', async (req, res) => {
  try {
    const result = await db.insert(leaveRequests).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ OVERTIME ============
app.get('/api/overtime', async (req, res) => {
  try {
    const result = await db.select().from(overtimeRequests);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overtime requests' });
  }
});

app.post('/api/overtime', async (req, res) => {
  try {
    const result = await db.insert(overtimeRequests).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ PAYROLL ============
app.get('/api/payroll', async (req, res) => {
  try {
    const result = await db.select().from(payslips);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
});

app.post('/api/payroll', async (req, res) => {
  try {
    const result = await db.insert(payslips).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ REIMBURSEMENTS ============
app.get('/api/reimbursements', async (req, res) => {
  try {
    const result = await db.select().from(reimbursements);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reimbursements' });
  }
});

app.post('/api/reimbursements', async (req, res) => {
  try {
    const result = await db.insert(reimbursements).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ANNOUNCEMENTS ============
app.get('/api/announcements', async (req, res) => {
  try {
    const result = await db.select().from(announcements);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const result = await db.insert(announcements).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ NOTIFICATIONS ============
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await db.select().from(notifications);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ============ TALENT / RECRUITMENT ============
app.get('/api/talent/job-postings', async (req, res) => {
  try {
    const result = await db.select().from(jobOpenings);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job postings' });
  }
});

app.post('/api/talent/job-postings', async (req, res) => {
  try {
    const result = await db.insert(jobOpenings).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/talent/candidates', async (req, res) => {
  try {
    const result = await db.select().from(candidates);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

app.post('/api/talent/candidates', async (req, res) => {
  try {
    const result = await db.insert(candidates).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/talent/assessments', async (req, res) => {
  try {
    const result = await db.select().from(assessments);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

app.get('/api/talent/onboarding', async (req, res) => {
  try {
    const result = await db.select().from(onboardingTasks);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch onboarding tasks' });
  }
});

// ============ CAREER ============
app.get('/api/talent/career-tracks', async (req, res) => {
  try {
    const result = await db.select().from(careerTracks);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch career tracks' });
  }
});

app.get('/api/talent/career-levels', async (req, res) => {
  try {
    const result = await db.select().from(careerLevels);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch career levels' });
  }
});

app.get('/api/talent/career-progress', async (req, res) => {
  try {
    const result = await db.select().from(employeeCareerProgress);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch career progress' });
  }
});

// ============ USERS ============
app.get('/api/employees/users/all', async (req, res) => {
  try {
    const result = await db.select().from(users);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ============ AUTH ============
app.post('/api/auth/sign-up/email', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    // Generate a simple ID for the user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const result = await db.insert(users).values({
      id: userId,
      email,
      name,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    res.status(201).json({ user: result[0] });
  } catch (error: any) {
    console.error('Sign up error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/sign-in/email', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await db.select().from(users).where(eq(users.email, email));
    if (result.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ user: result[0] });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Export for Vercel
export default app;
