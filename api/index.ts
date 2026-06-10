import express from 'express';
import cors from 'cors';

const app = express();
let initError: any = null;

try {
  const { toNodeHandler } = await import('better-auth/node');
  const { auth } = await import('../backend/src/config/auth');

  const customAuthRouter = await import('../backend/src/modules/auth/auth.routes');
  const employeesRouter = await import('../backend/src/modules/employees/employees.routes');
  const attendanceRouter = await import('../backend/src/modules/attendance/attendance.routes');
  const talentRouter = await import('../backend/src/modules/talent/talent.routes');
  const overtimeRouter = await import('../backend/src/modules/overtime/overtime.routes');
  const masterDataRouter = await import('../backend/src/modules/master-data/master-data.routes');
  const payrollRouter = await import('../backend/src/modules/payroll/payroll.routes');
  const essRouter = await import('../backend/src/modules/ess/ess.routes');
  const analyticsRouter = await import('../backend/src/modules/analytics/analytics.routes');

  app.use(cors({
    origin: process.env.VERCEL_URL 
      ? ([`https://${process.env.VERCEL_URL}`, process.env.FRONTEND_URL].filter(Boolean) as string[])
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }));

  app.use(express.json());
  app.use('/api/auth', toNodeHandler(auth));

  const safeUse = (path: string, routerModule: any) => {
    try {
      const router = routerModule.default || routerModule;
      if (typeof router === 'function') {
        app.use(path, router);
      } else {
        console.error(`Router for ${path} is not a function:`, typeof router);
      }
    } catch (err) {
      console.error(`Failed to register router for ${path}:`, err);
    }
  };

  safeUse('/api/auth-custom', customAuthRouter);
  safeUse('/api/employees', employeesRouter);
  safeUse('/api/attendance', attendanceRouter);
  safeUse('/api/talent', talentRouter);
  safeUse('/api/overtime', overtimeRouter);
  safeUse('/api/master-data', masterDataRouter);
  safeUse('/api/payroll', payrollRouter);
  safeUse('/api/ess', essRouter);
  safeUse('/api/analytics', analyticsRouter);

} catch (e) {
  console.error("Initialization error:", e);
  initError = e;
}

app.get('/api/health', (req, res) => {
  if (initError) {
    res.status(500).json({ status: 'error', error: String(initError), stack: initError.stack });
  } else {
    res.json({ status: 'ok', message: 'HRIS API is running' });
  }
});

// Fallback for any other API route if init failed
app.use((req, res, next) => {
  if (initError && req.path.startsWith('/api')) {
    res.status(500).json({ status: 'error', error: String(initError) });
  } else {
    next();
  }
});

export default app;
