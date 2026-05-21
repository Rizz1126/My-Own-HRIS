import express from 'express';
import cors from 'cors';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { 
  employees, departments, positions, contracts, projects, 
  assignments, clients, attendance, shifts, leaveRequests,
  overtimeRequests, payrollRecords, taxRecords, bpjsRecords,
  users, jobPostings, candidates, candidateStages, assessments,
  onboardingTasks, careerPaths
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

// CORS configuration
const allowedOrigins = process.env.VERCEL_URL 
  ? [`https://${process.env.VERCEL_URL}`, 'https://rizaldi-hris.vercel.app']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
      return callback(null, true);
    }
    // Allow all vercel.app subdomains
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now during development
  },
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

// ============ POSITIONS ============
app.get('/api/master-data/positions', async (req, res) => {
  try {
    const result = await db.select().from(positions);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

app.post('/api/master-data/positions', async (req, res) => {
  try {
    const result = await db.insert(positions).values(req.body).returning();
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
    const result = await db.select().from(attendance);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const result = await db.insert(attendance).values(req.body).returning();
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
    const result = await db.select().from(payrollRecords);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
});

app.get('/api/payroll/tax', async (req, res) => {
  try {
    const result = await db.select().from(taxRecords);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tax records' });
  }
});

app.get('/api/payroll/bpjs', async (req, res) => {
  try {
    const result = await db.select().from(bpjsRecords);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch BPJS records' });
  }
});

// ============ TALENT / RECRUITMENT ============
app.get('/api/talent/job-postings', async (req, res) => {
  try {
    const result = await db.select().from(jobPostings);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job postings' });
  }
});

app.post('/api/talent/job-postings', async (req, res) => {
  try {
    const result = await db.insert(jobPostings).values(req.body).returning();
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

app.get('/api/talent/career-paths', async (req, res) => {
  try {
    const result = await db.select().from(careerPaths);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch career paths' });
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

// ============ AUTH (Placeholder - needs better-auth setup) ============
app.post('/api/auth/sign-up/email', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    // For now, create user directly in database
    const result = await db.insert(users).values({
      email,
      name,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    res.status(201).json({ user: result[0] });
  } catch (error: any) {
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
