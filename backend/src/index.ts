import express from 'express';
import cors from 'cors';

// Load env only in development
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  const { fileURLToPath } = await import('url');
  const { dirname, resolve } = await import('path');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  dotenv.default.config({ path: resolve(__dirname, '../.env') });
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import { toNodeHandler } from 'better-auth/node';
import { auth } from './config/auth';

// Better Auth API Route
app.use('/api/auth', toNodeHandler(auth));

import customAuthRouter from './modules/auth/auth.routes';
app.use('/api/auth-custom', customAuthRouter);

// Basic healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HRIS API is running' });
});

import employeesRouter from './modules/employees/employees.routes';
import attendanceRouter from './modules/attendance/attendance.routes';
import talentRouter from './modules/talent/talent.routes';
import overtimeRouter from './modules/overtime/overtime.routes';
import masterDataRouter from './modules/master-data/master-data.routes';
import payrollRouter from './modules/payroll/payroll.routes';
import essRouter from './modules/ess/ess.routes';
import analyticsRouter from './modules/analytics/analytics.routes';

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
  import('path').then(({ resolve, dirname }) => {
    import('url').then(({ fileURLToPath }) => {
      const currentDir = typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));
      const distPath = resolve(currentDir, '../../dist');
      
      app.use(express.static(distPath));
      
      app.get('*', (req, res) => {
        res.sendFile(resolve(distPath, 'index.html'));
      });
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
