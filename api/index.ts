import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../backend/src/config/auth';

import customAuthRouter from '../backend/src/modules/auth/auth.routes';
import employeesRouter from '../backend/src/modules/employees/employees.routes';
import attendanceRouter from '../backend/src/modules/attendance/attendance.routes';
import talentRouter from '../backend/src/modules/talent/talent.routes';
import overtimeRouter from '../backend/src/modules/overtime/overtime.routes';
import masterDataRouter from '../backend/src/modules/master-data/master-data.routes';
import payrollRouter from '../backend/src/modules/payroll/payroll.routes';
import essRouter from '../backend/src/modules/ess/ess.routes';
import analyticsRouter from '../backend/src/modules/analytics/analytics.routes';

const app = express();

// CORS configuration for Vercel deployment
app.use(cors({
  origin: process.env.VERCEL_URL 
    ? ([`https://${process.env.VERCEL_URL}`, process.env.FRONTEND_URL].filter(Boolean) as string[])
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());

// Better Auth API Route
app.use('/api/auth', toNodeHandler(auth));

const resolveRouter = (router: any) => router.default || router;

// Custom auth routes
app.use('/api/auth-custom', resolveRouter(customAuthRouter));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HRIS API is running' });
});

// API routes
app.use('/api/employees', resolveRouter(employeesRouter));
app.use('/api/attendance', resolveRouter(attendanceRouter));
app.use('/api/talent', resolveRouter(talentRouter));
app.use('/api/overtime', resolveRouter(overtimeRouter));
app.use('/api/master-data', resolveRouter(masterDataRouter));
app.use('/api/payroll', resolveRouter(payrollRouter));
app.use('/api/ess', resolveRouter(essRouter));
app.use('/api/analytics', resolveRouter(analyticsRouter));

export default app;
