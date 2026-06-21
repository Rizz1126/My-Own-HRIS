import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EmployeeProvider } from './context/EmployeeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Lounge from './pages/Lounge';
import OnboardingForm from './pages/public/OnboardingForm';

// Master Data
import Employees from './pages/master-data/Employees';
import Contracts from './pages/master-data/Contracts';
import Assignments from './pages/master-data/Assignments';
import Projects from './pages/master-data/Projects';
import Clients from './pages/master-data/Clients';
import Organization from './pages/core-hr/Organization';
import Documents from './pages/core-hr/Documents';

// Time & Attendance
import Presence from './pages/attendance/Presence';
import Shifts from './pages/attendance/Shifts';
import OvertimeRequest from './pages/attendance/OvertimeRequest';
import OvertimeStats from './pages/attendance/OvertimeStats';
import OvertimeProcessing from './pages/attendance/OvertimeProcessing';
import MyOvertime from './pages/attendance/MyOvertime';
import MyLeave from './pages/attendance/MyLeave';
import LeaveCalendar from './pages/attendance/LeaveCalendar';
import LeaveApproval from './pages/attendance/LeaveApproval';
import OvertimeEntry from './pages/attendance/OvertimeEntry';

// Payroll
import Calculation from './pages/payroll/Calculation';
import Tax from './pages/payroll/Tax';
import BPJS from './pages/payroll/BPJS';
import Payslips from './pages/payroll/Payslips';

// Talent Management
import Recruitment from './pages/talent/Recruitment';
import RecruitmentAnalytics from './pages/talent/RecruitmentAnalytics';
import Onboarding from './pages/talent/Onboarding';
import Assessment from './pages/talent/Assessment';
import CareerPath from './pages/talent/CareerPath';
import OKRBoard from './pages/talent/OKRBoard';

// Employee Self-Service
import MyAttendance from './pages/ess/MyAttendance';
import MyPayslips from './pages/ess/MyPayslips';
import Reimbursement from './pages/ess/Reimbursement';
import MyAssessments from './pages/ess/MyAssessments';
import MyProfile from './pages/ess/MyProfile';
import MyOKR from './pages/ess/MyOKR';

// People Analytics
import Turnover from './pages/analytics/Turnover';
import AttendanceHeatmap from './pages/analytics/AttendanceHeatmap';
import CostPrediction from './pages/analytics/CostPrediction';

// Administration
import UserManagement from './pages/admin/UserManagement';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <EmployeeProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding/fill/:candidateId" element={<OnboardingForm />} />

          {/* Protected Routes */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Lounge />} />
          <Route path="/lounge" element={<Lounge />} />
          <Route path="/dashboard" element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />

            {/* Master Data */}
            <Route path="/master-data/employees" element={<Employees />} />
            <Route path="/master-data/contracts" element={<Contracts />} />
            <Route path="/master-data/assignments" element={<Assignments />} />
            <Route path="/master-data/projects" element={<Projects />} />
            <Route path="/master-data/clients" element={<Clients />} />
            <Route path="/master-data/organization" element={<Organization />} />
            <Route path="/master-data/documents" element={<Documents />} />

            {/* Time & Attendance */}
            <Route path="/attendance/presence" element={<Presence />} />
            <Route path="/attendance/shifts" element={<Shifts />} />
            <Route path="/attendance/overtime" element={<OvertimeRequest />} />
            <Route path="/attendance/overtime-entry" element={<OvertimeEntry />} />
            <Route path="/attendance/my-overtime" element={<MyOvertime />} />
            <Route path="/attendance/overtime-stats" element={<OvertimeStats />} />
            <Route path="/attendance/overtime-processing" element={<OvertimeProcessing />} />
            <Route path="/attendance/my-leave" element={<MyLeave />} />
            <Route path="/attendance/leave-calendar" element={<LeaveCalendar />} />
            <Route path="/attendance/leave-approval" element={<LeaveApproval />} />

            {/* Payroll */}
            <Route path="/payroll/calculation" element={<Calculation />} />
            <Route path="/payroll/tax" element={<Tax />} />
            <Route path="/payroll/bpjs" element={<BPJS />} />
            <Route path="/payroll/payslips" element={<Payslips />} />

            {/* Talent Management */}
            <Route path="/talent/recruitment" element={<Recruitment />} />
            <Route path="/talent/recruitment-analytics" element={<RecruitmentAnalytics />} />
            <Route path="/talent/onboarding" element={<Onboarding />} />
            <Route path="/talent/assessment" element={<Assessment />} />
            <Route path="/talent/career-path" element={<CareerPath />} />
            <Route path="/talent/okr" element={<OKRBoard />} />

            {/* Employee Self-Service */}
            <Route path="/ess/my-attendance" element={<MyAttendance />} />
            <Route path="/ess/my-payslips" element={<MyPayslips />} />
            <Route path="/ess/reimbursement" element={<Reimbursement />} />
            <Route path="/ess/my-assessments" element={<MyAssessments />} />
            <Route path="/ess/my-profile" element={<MyProfile />} />
            <Route path="/ess/my-okr" element={<MyOKR />} />

            {/* People Analytics */}
            <Route path="/analytics/turnover" element={<Turnover />} />
            <Route path="/analytics/attendance-heatmap" element={<AttendanceHeatmap />} />
            <Route path="/analytics/cost-prediction" element={<CostPrediction />} />

            {/* Administration */}
            <Route path="/admin/user-management" element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </EmployeeProvider>
    </ToastProvider>
  </AuthProvider>
  );
}
