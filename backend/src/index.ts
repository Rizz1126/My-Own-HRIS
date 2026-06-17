import express from 'express';
import cors from 'cors';

import dotenv from 'dotenv';
import path from 'path';

// Load env only in development
if (process.env.NODE_ENV !== 'production') {
  const envPath = process.cwd().endsWith('backend') 
    ? path.resolve(process.cwd(), '.env') 
    : path.resolve(process.cwd(), 'backend', '.env');
  dotenv.config({ path: envPath });
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import { auth } from './config/auth.js';

// Better Auth API Route
let authHandler: any;
app.all('/api/auth/{*path}', async (req, res, next) => {
  if (!authHandler) {
    const { toNodeHandler } = await import('better-auth/node');
    authHandler = toNodeHandler(auth);
  }
  return authHandler(req, res);
});

import customAuthRouter from './modules/auth/auth.routes.js';
app.use('/api/auth-custom', customAuthRouter);

// Basic healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HRIS API is running' });
});

import employeesRouter from './modules/employees/employees.routes.js';
import attendanceRouter from './modules/attendance/attendance.routes.js';
import talentRouter from './modules/talent/talent.routes.js';
import overtimeRouter from './modules/overtime/overtime.routes.js';
import masterDataRouter from './modules/master-data/master-data.routes.js';
import payrollRouter from './modules/payroll/payroll.routes.js';
import essRouter from './modules/ess/ess.routes.js';
import analyticsRouter from './modules/analytics/analytics.routes.js';

app.use('/api/employees', employeesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/talent', talentRouter);
app.use('/api/overtime', overtimeRouter);
app.use('/api/master-data', masterDataRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/ess', essRouter);
app.use('/api/analytics', analyticsRouter);

// Serve static frontend files in production (Render All-in-One)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  import('path').then(({ resolve }) => {
    const distPath = resolve(__dirname, '../../dist');
    
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(resolve(distPath, 'index.html'));
    });
  });
}

// Start server on Render or Local (Skip only on Vercel Serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
