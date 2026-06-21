import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Create db connection
const queryClient = postgres(process.env.DATABASE_URL as string);
const db = drizzle(queryClient, { schema });
import { eq, sql } from 'drizzle-orm';

async function main() {
  console.log('🚀 Starting comprehensive seeding...');

  try {
    // 1. Clear existing data (in reverse order of dependencies)
    console.log('🧹 Cleaning up old data...');
    const tables = [
      schema.okrCheckIns, schema.okrAlignments, schema.keyResults, schema.objectives,
      schema.notifications, schema.reimbursements, schema.payslips, schema.assessmentScores, schema.assessments, 
      schema.employeeCareerProgress, schema.careerLevels, schema.overtimeRequests, schema.leaveRequests, 
      schema.attendances, schema.employeeSchedules, schema.onboardingTasks, schema.assignments,
      schema.contracts, schema.announcements, schema.candidates, schema.jobOpenings, schema.projects, 
      schema.clients, schema.employees, schema.departments, schema.shifts, schema.careerTracks, 
      schema.sessions, schema.accounts, schema.verification, schema.users
    ];
    for (const table of tables) {
      try {
        await db.delete(table);
      } catch (e) {
        console.log(`Skipping delete for table: ${(e as Error).message}`);
      }
    }

    // 2. Create Departments
    console.log('🏢 Creating departments...');
    const depts = await db.insert(schema.departments).values([
      { name: 'Engineering', colorCode: '#6366F1' },
      { name: 'Human Resources', colorCode: '#EC4899' },
      { name: 'Product Management', colorCode: '#F59E0B' },
      { name: 'Marketing', colorCode: '#10B981' },
      { name: 'Operations', colorCode: '#3B82F6' },
      { name: 'Finance', colorCode: '#8B5CF6' },
      { name: 'Sales', colorCode: '#EF4444' },
    ]).returning();

    // 3. Create Shifts
    console.log('🕒 Creating shifts...');
    const shiftData = await db.insert(schema.shifts).values([
      { name: 'Regular Morning', startTime: '08:00', endTime: '17:00', color: '#10B981' },
      { name: 'Evening Shift', startTime: '14:00', endTime: '22:00', color: '#F59E0B' },
      { name: 'Night Shift', startTime: '22:00', endTime: '06:00', color: '#6366F1' },
    ]).returning();

    // 4. Create users
    console.log('👤 Creating users...');
    const userData = [
      { id: 'user-superadmin', name: 'Topan Rizaldi', email: 'superadmin@perusahaan.id', role: 'Super Admin' },
      { id: 'user-admin', name: 'Siti Aminah', email: 'admin@perusahaan.id', role: 'Admin' },
      { id: 'user-employee', name: 'Budi Santoso', email: 'budi.santoso@perusahaan.id', role: 'Employee' },
    ];
    
    for (const user of userData) {
      try {
        await db.insert(schema.users).values(user);
      } catch (e) {}
    }

    // 5. Create Employees
    console.log('👥 Creating employees...');
    const employeeData: any[] = [
      { id: 'EMP001', name: 'Topan Rizaldi', email: 'superadmin@perusahaan.id', nik: '3201011001900001', position: 'CTO', departmentId: depts[0].id, level: 'Director', joinDate: '2020-01-01', baseSalary: 45000000, status: 'Active', userId: 'user-superadmin' },
      { id: 'EMP002', name: 'Siti Aminah', email: 'admin@perusahaan.id', nik: '3201015002920002', position: 'HR Manager', departmentId: depts[1].id, level: 'Manager', joinDate: '2021-03-15', baseSalary: 25000000, status: 'Active', userId: 'user-admin' },
      { id: 'EMP003', name: 'Budi Santoso', email: 'budi.santoso@perusahaan.id', nik: '3201011203880003', position: 'Senior Developer', departmentId: depts[0].id, level: 'Senior', joinDate: '2022-06-01', baseSalary: 20000000, status: 'Active', userId: 'user-employee' },
      { id: 'EMP004', name: 'Dewi Lestari', email: 'dewi.lestari@perusahaan.id', nik: '3201014504950004', position: 'UI/UX Designer', departmentId: depts[0].id, level: 'Middle', joinDate: '2022-08-10', baseSalary: 15000000, status: 'Active' },
      { id: 'EMP005', name: 'Eko Prasetyo', email: 'eko.prasetyo@perusahaan.id', nik: '3201011805930005', position: 'Product Manager', departmentId: depts[2].id, level: 'Manager', joinDate: '2021-11-20', baseSalary: 22000000, status: 'Active' },
    ];

    const firstNames = ['Agus', 'Bambang', 'Citra', 'Dian', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Iwan', 'Joko', 'Kiki', 'Lestari', 'Mila', 'Nina', 'Oka', 'Putri', 'Qori', 'Rudi', 'Sari', 'Tomi'];
    const lastNames = ['Pratama', 'Saputra', 'Wijaya', 'Kusuma', 'Nugroho', 'Setiawan', 'Hidayat', 'Pangestu', 'Wibowo', 'Siregar'];
    
    for (let i = 6; i <= 35; i++) {
      const fname = firstNames[i % firstNames.length];
      const lname = lastNames[i % lastNames.length];
      const dep = depts[i % depts.length];
      
      employeeData.push({
        id: `EMP0${i.toString().padStart(2, '0')}`,
        name: `${fname} ${lname}`,
        email: `${fname.toLowerCase()}.${lname.toLowerCase()}@perusahaan.id`,
        nik: `320101${Math.floor(Math.random() * 900000) + 100000}00${i}`,
        position: dep.name === 'Engineering' ? 'Software Engineer' : `${dep.name} Specialist`,
        departmentId: dep.id,
        level: i % 4 === 0 ? 'Senior' : (i % 3 === 0 ? 'Manager' : 'Junior'),
        joinDate: new Date(Date.now() - Math.random() * 100000000000).toISOString().split('T')[0],
        baseSalary: Math.floor(Math.random() * 15000000) + 7000000,
        status: 'Active',
      });
    }

    const createdEmployees: (typeof schema.employees.$inferSelect)[] = [];
    for (const emp of employeeData) {
      try {
        const result = await db.insert(schema.employees).values(emp).returning();
        createdEmployees.push(result[0]);
      } catch (e) {
        console.log(`Failed to insert employee ${emp.id}: ${(e as Error).message}`);
      }
    }

    // 6. Contracts
    console.log('📜 Creating contracts...');
    const contractData = createdEmployees.map(emp => ({
      employeeId: emp.id,
      type: emp.level === 'Director' || emp.level === 'Manager' ? 'PKWTT' : 'PKWT',
      startDate: emp.joinDate,
      endDate: emp.level === 'Director' || emp.level === 'Manager' ? null : '2025-12-31',
    }));
    if (contractData.length > 0) await db.insert(schema.contracts).values(contractData);

    // 7. Clients & Projects
    console.log('📁 Creating projects...');
    const clientList = await db.insert(schema.clients).values([
      { code: 'CL-001', name: 'Tech Solutions Corp', industry: 'IT Services', active: true },
      { code: 'CL-002', name: 'Global Finance Ltd', industry: 'Banking', active: true },
      { code: 'CL-003', name: 'Maju Jaya Retail', industry: 'Retail', active: true },
      { code: 'CL-004', name: 'Bhakti Husada', industry: 'Healthcare', active: true }
    ]).returning();

    const projectList = await db.insert(schema.projects).values([
      { name: 'Cloud Migration', clientId: clientList[0].id, status: 'Active', startDate: '2023-10-01' },
      { name: 'Fintech App Mobile', clientId: clientList[1].id, status: 'Active', startDate: '2024-01-15' },
      { name: 'E-commerce Redesign', clientId: clientList[2].id, status: 'Active', startDate: '2024-03-01' },
      { name: 'Hospital Management System', clientId: clientList[3].id, status: 'On Hold', startDate: '2024-02-10' },
      { name: 'Internal HRIS Overhaul', clientId: clientList[0].id, status: 'Active', startDate: '2024-04-01' }
    ]).returning();

    // Assign employees to projects
    const assignmentData = createdEmployees.map((emp, idx) => ({
      employeeId: emp.id,
      projectId: projectList[idx % projectList.length].id,
      departmentId: emp.departmentId,
      role: emp.position,
      startDate: '2024-01-01',
      allocation: 100
    }));
    if (assignmentData.length > 0) await db.insert(schema.assignments).values(assignmentData);

    // 8. Attendance (Last 14 days)
    console.log('📅 Creating attendance logs...');
    const attendanceLogs: (typeof schema.attendances.$inferInsert)[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

      for (const emp of createdEmployees) {
        // Add some random absences and lates
        const isAbsent = Math.random() < 0.05;
        const isLate = Math.random() < 0.15;
        
        if (isAbsent) {
          attendanceLogs.push({
            employeeId: emp.id,
            date: dateStr,
            status: 'Absent'
          });
        } else {
          attendanceLogs.push({
            employeeId: emp.id,
            date: dateStr,
            checkInTime: new Date(dateStr + (isLate ? 'T09:15:00Z' : 'T08:05:00Z')),
            checkOutTime: new Date(dateStr + 'T17:15:00Z'),
            status: isLate ? 'Late' : 'Present'
          });
        }
      }
    }
    if (attendanceLogs.length > 0) await db.insert(schema.attendances).values(attendanceLogs);

    // 9. Leave Requests
    console.log('🏖️ Creating leave requests...');
    const leaveData = [
      { id: 'LV-001', employeeId: createdEmployees[2].id, type: 'Annual Leave', startDate: '2024-06-10', endDate: '2024-06-12', status: 'Approved', reason: 'Family Vacation' },
      { id: 'LV-002', employeeId: createdEmployees[3].id, type: 'Sick Leave', startDate: '2024-05-15', endDate: '2024-05-16', status: 'Approved', reason: 'Fever' },
      { id: 'LV-003', employeeId: createdEmployees[5].id, type: 'Annual Leave', startDate: '2024-07-01', endDate: '2024-07-05', status: 'Pending', reason: 'Trip to Bali' },
      { id: 'LV-004', employeeId: createdEmployees[8].id, type: 'Maternity Leave', startDate: '2024-08-01', endDate: '2024-11-01', status: 'Approved', reason: 'Maternity' },
      { id: 'LV-005', employeeId: createdEmployees[12].id, type: 'Personal Leave', startDate: '2024-06-20', endDate: '2024-06-20', status: 'Pending', reason: 'Personal matters' },
    ];
    if (leaveData.length > 0) await db.insert(schema.leaveRequests).values(leaveData);

    // 10. Overtime
    console.log('🌙 Creating overtime requests...');
    const overtimeData = [
      { id: 'OVT-001', employeeId: createdEmployees[2].id, date: '2024-06-01', startTime: '17:00', endTime: '21:00', hours: '4', status: 'Approved', task: 'Hotfix production issue', achievement: 'Completed' },
      { id: 'OVT-002', employeeId: createdEmployees[6].id, date: '2024-06-05', startTime: '17:00', endTime: '19:00', hours: '2', status: 'Approved', task: 'Finalize monthly report', achievement: 'Report submitted' },
      { id: 'OVT-003', employeeId: createdEmployees[9].id, date: '2024-06-08', startTime: '17:00', endTime: '20:00', hours: '3', status: 'Pending', task: 'Deploy new feature branch', achievement: 'Deployed' },
      { id: 'OVT-004', employeeId: createdEmployees[15].id, date: '2024-05-28', startTime: '18:00', endTime: '21:00', hours: '3', status: 'Approved', task: 'Client emergency meeting', achievement: 'Meeting done' },
    ];
    if (overtimeData.length > 0) await db.insert(schema.overtimeRequests).values(overtimeData);

    // 11. Recruitment
    console.log('🎯 Creating recruitment data...');
    const openingList = await db.insert(schema.jobOpenings).values([
      { title: 'Senior React Developer', departmentId: depts[0].id, type: 'Full-time', location: 'Jakarta (Remote)', status: 'Open' },
      { title: 'Product Designer', departmentId: depts[2].id, type: 'Full-time', location: 'Bandung', status: 'Open' },
      { title: 'HR Business Partner', departmentId: depts[1].id, type: 'Contract', location: 'Jakarta', status: 'Closed' }
    ]).returning();

    await db.insert(schema.candidates).values([
      { jobId: openingList[0].id, name: 'Kevin Durant', email: 'kevin@example.com', stage: 'Interview', rating: '4.5' },
      { jobId: openingList[0].id, name: 'Stephen Curry', email: 'steph@example.com', stage: 'Applied', rating: '4.0' },
      { jobId: openingList[1].id, name: 'LeBron James', email: 'lebron@example.com', stage: 'Screening', rating: '3.8' },
      { jobId: openingList[1].id, name: 'Kobe Bryant', email: 'kobe@example.com', stage: 'Offered', rating: '4.9' },
      { jobId: openingList[2].id, name: 'Michael Jordan', email: 'mj@example.com', stage: 'Hired', rating: '5.0' },
    ]);

    // 12. Payroll (Last 6 months)
    console.log('💰 Creating historical payslips...');
    const payslipData: (typeof schema.payslips.$inferInsert)[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      
      createdEmployees.forEach(emp => {
        payslipData.push({
          employeeId: emp.id,
          periodMonth: m,
          periodYear: y,
          baseSalary: emp.baseSalary,
          allowancesTotal: 2000000,
          deductionsTotal: 500000,
          netPay: emp.baseSalary + 2000000 - 500000,
          status: 'Paid'
        });
      });
    }
    if (payslipData.length > 0) await db.insert(schema.payslips).values(payslipData);

    // 13. Reimbursements
    console.log('🧾 Creating reimbursements...');
    const reimbursementData = [
      { id: crypto.randomUUID(), employeeId: createdEmployees[2].id, title: 'Monitor 4K', amount: 4500000, type: 'Other', status: 'Approved', description: 'Equipment for remote work' },
      { id: crypto.randomUUID(), employeeId: createdEmployees[3].id, title: 'Internet Subscription', amount: 500000, type: 'Other', status: 'Pending', description: 'Monthly allowance' },
      { id: crypto.randomUUID(), employeeId: createdEmployees[7].id, title: 'Client Dinner', amount: 1250000, type: 'Travel', status: 'Approved', description: 'Meeting with Global Finance Ltd' },
      { id: crypto.randomUUID(), employeeId: createdEmployees[11].id, title: 'Medical Checkup', amount: 850000, type: 'Medical', status: 'Rejected', description: 'Annual checkup' },
    ];
    if (reimbursementData.length > 0) await db.insert(schema.reimbursements).values(reimbursementData);

    // 14. Announcements
    console.log('📢 Creating announcements...');
    const announcementData = [
      { title: 'Welcome to the New HRIS System!', content: 'We are excited to announce the launch of our new HRIS system. This platform will streamline all HR processes.', priority: 'High', createdBy: createdEmployees[0].id },
      { title: 'Townhall Meeting Q3', content: 'Please join our upcoming Townhall Meeting next Friday at 2 PM to discuss Q3 targets.', priority: 'Normal', createdBy: createdEmployees[1].id },
      { title: 'Health Insurance Upgrade', content: 'Great news! We have upgraded our corporate health insurance policy to cover dental.', priority: 'Normal', createdBy: createdEmployees[1].id },
      { title: 'Server Maintenance', content: 'Our main application servers will be undergoing maintenance this Saturday from 2 AM to 4 AM.', priority: 'High', createdBy: createdEmployees[0].id },
    ];
    if (announcementData.length > 0) await db.insert(schema.announcements).values(announcementData);

    // 15. OKR Data
    console.log('🎯 Creating OKR data...');
    const currentYear = new Date().getFullYear();
    const currentQ = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${currentYear}`;

    // Company-level objectives
    const companyObjs = await db.insert(schema.objectives).values([
      { title: 'Achieve 30% revenue growth through enterprise expansion', description: 'Focus on acquiring enterprise-level clients and increasing ARPU.', level: 'company', period: currentQ, status: 'Active', progress: '0.55' },
      { title: 'Build a world-class engineering culture', description: 'Invest in developer experience, reduce tech debt, and improve deployment velocity.', level: 'company', period: currentQ, status: 'Active', progress: '0.42' },
      { title: 'Become the employer of choice in the tech industry', description: 'Improve employer branding, reduce turnover, and increase eNPS.', level: 'company', period: currentQ, status: 'Active', progress: '0.38' },
    ]).returning();

    // Company KRs
    const companyKRs = await db.insert(schema.keyResults).values([
      { objectiveId: companyObjs[0].id, metricName: 'New enterprise clients acquired', unit: 'count', initialValue: '0', targetValue: '15', currentValue: '8', confidence: 'On Track' },
      { objectiveId: companyObjs[0].id, metricName: 'Monthly recurring revenue', unit: 'IDR', initialValue: '500000000', targetValue: '1000000000', currentValue: '780000000', confidence: 'On Track' },
      { objectiveId: companyObjs[0].id, metricName: 'Customer churn rate', unit: '%', initialValue: '8', targetValue: '3', currentValue: '5', confidence: 'At Risk' },
      { objectiveId: companyObjs[1].id, metricName: 'Deployment frequency (per week)', unit: 'count', initialValue: '2', targetValue: '10', currentValue: '6', confidence: 'On Track' },
      { objectiveId: companyObjs[1].id, metricName: 'Code review turnaround (hours)', unit: 'hours', initialValue: '24', targetValue: '4', currentValue: '8', confidence: 'At Risk' },
      { objectiveId: companyObjs[1].id, metricName: 'Tech debt reduction (story points)', unit: 'points', initialValue: '0', targetValue: '200', currentValue: '80', confidence: 'On Track' },
      { objectiveId: companyObjs[2].id, metricName: 'Employee NPS score', unit: 'score', initialValue: '30', targetValue: '70', currentValue: '48', confidence: 'On Track' },
      { objectiveId: companyObjs[2].id, metricName: 'Voluntary turnover rate', unit: '%', initialValue: '15', targetValue: '5', currentValue: '9', confidence: 'At Risk' },
      { objectiveId: companyObjs[2].id, metricName: 'Offer acceptance rate', unit: '%', initialValue: '60', targetValue: '90', currentValue: '75', confidence: 'On Track' },
    ]).returning();

    // Department-level objectives
    const deptObjs = await db.insert(schema.objectives).values([
      { title: 'Deliver scalable API platform for enterprise clients', level: 'department', period: currentQ, status: 'Active', progress: '0.60', departmentId: depts[0].id, parentObjectiveId: companyObjs[0].id },
      { title: 'Implement CI/CD pipeline and automated testing', level: 'department', period: currentQ, status: 'Active', progress: '0.45', departmentId: depts[0].id, parentObjectiveId: companyObjs[1].id },
      { title: 'Launch employer branding campaign', level: 'department', period: currentQ, status: 'Active', progress: '0.30', departmentId: depts[1].id, parentObjectiveId: companyObjs[2].id },
      { title: 'Increase qualified leads by 50%', level: 'department', period: currentQ, status: 'Active', progress: '0.52', departmentId: depts[3].id, parentObjectiveId: companyObjs[0].id },
      { title: 'Optimize financial reporting and cost control', level: 'department', period: currentQ, status: 'Active', progress: '0.65', departmentId: depts[5].id, parentObjectiveId: companyObjs[0].id },
      { title: 'Launch new product vertical for healthcare', level: 'department', period: currentQ, status: 'Active', progress: '0.35', departmentId: depts[2].id, parentObjectiveId: companyObjs[0].id },
    ]).returning();

    // Department alignments
    await db.insert(schema.okrAlignments).values([
      { childObjectiveId: deptObjs[0].id, parentObjectiveId: companyObjs[0].id },
      { childObjectiveId: deptObjs[1].id, parentObjectiveId: companyObjs[1].id },
      { childObjectiveId: deptObjs[2].id, parentObjectiveId: companyObjs[2].id },
      { childObjectiveId: deptObjs[3].id, parentObjectiveId: companyObjs[0].id },
      { childObjectiveId: deptObjs[4].id, parentObjectiveId: companyObjs[0].id },
      { childObjectiveId: deptObjs[5].id, parentObjectiveId: companyObjs[0].id },
    ]);

    // Department KRs
    const deptKRs = await db.insert(schema.keyResults).values([
      { objectiveId: deptObjs[0].id, metricName: 'API endpoints delivered', unit: 'count', initialValue: '0', targetValue: '50', currentValue: '30', confidence: 'On Track' },
      { objectiveId: deptObjs[0].id, metricName: 'API latency p95 (ms)', unit: 'ms', initialValue: '500', targetValue: '100', currentValue: '180', confidence: 'At Risk' },
      { objectiveId: deptObjs[1].id, metricName: 'Test coverage', unit: '%', initialValue: '40', targetValue: '85', currentValue: '62', confidence: 'On Track' },
      { objectiveId: deptObjs[1].id, metricName: 'Build success rate', unit: '%', initialValue: '75', targetValue: '98', currentValue: '88', confidence: 'On Track' },
      { objectiveId: deptObjs[2].id, metricName: 'Glassdoor rating', unit: 'score', initialValue: '3.2', targetValue: '4.5', currentValue: '3.6', confidence: 'At Risk' },
      { objectiveId: deptObjs[2].id, metricName: 'Social media followers', unit: 'count', initialValue: '5000', targetValue: '15000', currentValue: '7200', confidence: 'On Track' },
      { objectiveId: deptObjs[3].id, metricName: 'Marketing qualified leads', unit: 'count', initialValue: '100', targetValue: '250', currentValue: '165', confidence: 'On Track' },
      { objectiveId: deptObjs[4].id, metricName: 'Monthly close cycle (days)', unit: 'days', initialValue: '15', targetValue: '5', currentValue: '8', confidence: 'On Track' },
      { objectiveId: deptObjs[5].id, metricName: 'Healthcare beta users', unit: 'count', initialValue: '0', targetValue: '20', currentValue: '7', confidence: 'On Track' },
    ]).returning();

    // Individual-level objectives
    const individualObjs = await db.insert(schema.objectives).values([
      { title: 'Design and implement microservices architecture', level: 'individual', period: currentQ, status: 'Active', progress: '0.70', ownerId: createdEmployees[2]?.id, parentObjectiveId: deptObjs[0].id },
      { title: 'Set up automated E2E testing pipeline', level: 'individual', period: currentQ, status: 'Active', progress: '0.45', ownerId: createdEmployees[3]?.id, parentObjectiveId: deptObjs[1].id },
      { title: 'Redesign employee onboarding experience', level: 'individual', period: currentQ, status: 'Active', progress: '0.55', ownerId: createdEmployees[1]?.id, parentObjectiveId: deptObjs[2].id },
      { title: 'Develop content marketing strategy', level: 'individual', period: currentQ, status: 'Active', progress: '0.40', ownerId: createdEmployees[4]?.id, parentObjectiveId: deptObjs[3].id },
      { title: 'Automate monthly financial reconciliation', level: 'individual', period: currentQ, status: 'Active', progress: '0.80', ownerId: createdEmployees[5]?.id, parentObjectiveId: deptObjs[4].id },
      { title: 'Build healthcare module MVP', level: 'individual', period: currentQ, status: 'Active', progress: '0.30', ownerId: createdEmployees[0]?.id, parentObjectiveId: deptObjs[5].id },
      { title: 'Reduce bug backlog by 60%', level: 'individual', period: currentQ, status: 'Active', progress: '0.55', ownerId: createdEmployees[6]?.id, parentObjectiveId: deptObjs[1].id },
      { title: 'Improve API documentation coverage', level: 'individual', period: currentQ, status: 'Active', progress: '0.65', ownerId: createdEmployees[7]?.id, parentObjectiveId: deptObjs[0].id },
    ]).returning();

    // Individual alignments
    const indAlignments = individualObjs.map(obj => ({
      childObjectiveId: obj.id,
      parentObjectiveId: obj.parentObjectiveId!,
    })).filter(a => a.parentObjectiveId);
    if (indAlignments.length > 0) await db.insert(schema.okrAlignments).values(indAlignments);

    // Individual KRs
    const indKRs = await db.insert(schema.keyResults).values([
      { objectiveId: individualObjs[0].id, metricName: 'Services migrated to microservices', unit: 'count', initialValue: '0', targetValue: '8', currentValue: '6', confidence: 'On Track' },
      { objectiveId: individualObjs[0].id, metricName: 'Service uptime', unit: '%', initialValue: '95', targetValue: '99.9', currentValue: '99.2', confidence: 'On Track' },
      { objectiveId: individualObjs[1].id, metricName: 'E2E test scenarios automated', unit: 'count', initialValue: '0', targetValue: '100', currentValue: '45', confidence: 'At Risk' },
      { objectiveId: individualObjs[2].id, metricName: 'Onboarding completion rate', unit: '%', initialValue: '60', targetValue: '95', currentValue: '78', confidence: 'On Track' },
      { objectiveId: individualObjs[2].id, metricName: 'New hire satisfaction score', unit: 'score', initialValue: '3', targetValue: '4.5', currentValue: '3.8', confidence: 'On Track' },
      { objectiveId: individualObjs[3].id, metricName: 'Blog posts published', unit: 'count', initialValue: '0', targetValue: '12', currentValue: '5', confidence: 'On Track' },
      { objectiveId: individualObjs[3].id, metricName: 'Organic traffic increase', unit: '%', initialValue: '0', targetValue: '40', currentValue: '15', confidence: 'At Risk' },
      { objectiveId: individualObjs[4].id, metricName: 'Reconciliation time saved (hours/month)', unit: 'hours', initialValue: '0', targetValue: '20', currentValue: '16', confidence: 'On Track' },
      { objectiveId: individualObjs[5].id, metricName: 'MVP features completed', unit: 'count', initialValue: '0', targetValue: '15', currentValue: '5', confidence: 'At Risk' },
      { objectiveId: individualObjs[6].id, metricName: 'Bugs resolved', unit: 'count', initialValue: '0', targetValue: '60', currentValue: '33', confidence: 'On Track' },
      { objectiveId: individualObjs[7].id, metricName: 'API endpoints documented', unit: '%', initialValue: '30', targetValue: '100', currentValue: '75', confidence: 'On Track' },
    ]).returning();

    // Check-in history (simulate 6 weeks of check-ins for some KRs)
    const checkInData: (typeof schema.okrCheckIns.$inferInsert)[] = [];
    const sampleKRs = [companyKRs[0], companyKRs[1], deptKRs[0], indKRs[0], indKRs[2]];
    const progressSteps = [
      [1, 3, 5, 6, 7, 8],           // enterprise clients
      [550000000, 620000000, 680000000, 720000000, 750000000, 780000000], // MRR
      [5, 10, 16, 22, 26, 30],       // API endpoints
      [1, 2, 3, 4, 5, 6],           // microservices migrated
      [5, 12, 20, 28, 38, 45],      // E2E tests
    ];

    for (let krIdx = 0; krIdx < sampleKRs.length; krIdx++) {
      const kr = sampleKRs[krIdx];
      const steps = progressSteps[krIdx];
      for (let week = 0; week < steps.length; week++) {
        const d = new Date();
        d.setDate(d.getDate() - (steps.length - week) * 7);
        checkInData.push({
          keyResultId: kr.id,
          value: steps[week].toString(),
          comment: week === steps.length - 1 ? 'Latest update — progressing well.' : `Week ${week + 1} check-in.`,
          confidence: steps[week] / parseFloat(kr.targetValue) >= 0.5 ? 'On Track' : 'At Risk',
          createdBy: createdEmployees[krIdx % createdEmployees.length]?.id,
          createdAt: d,
        });
      }
    }
    if (checkInData.length > 0) await db.insert(schema.okrCheckIns).values(checkInData);

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    process.exit(0);
  }
}

main().catch(console.error);
