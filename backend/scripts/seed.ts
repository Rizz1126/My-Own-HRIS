import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import dotenv from 'dotenv';

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
    ]).returning();

    // 3. Create Shifts
    console.log('🕒 Creating shifts...');
    const shiftData = await db.insert(schema.shifts).values([
      { name: 'Regular Morning', startTime: '08:00', endTime: '17:00', color: '#10B981' },
      { name: 'Evening Shift', startTime: '14:00', endTime: '22:00', color: '#F59E0B' },
    ]).returning();

    // 4. Create or get users for employees
    console.log('👤 Creating users...');
    const userData = [
      { id: 'user-superadmin', name: 'Topan Rizaldi', email: 'superadmin@perusahaan.id', role: 'Super Admin' },
      { id: 'user-admin', name: 'Siti Aminah', email: 'admin@perusahaan.id', role: 'Admin' },
      { id: 'user-employee', name: 'Budi Santoso', email: 'budi.santoso@perusahaan.id', role: 'Employee' },
    ];
    
    for (const user of userData) {
      try {
        await db.insert(schema.users).values(user);
      } catch (e) {
        // User might already exist, skip
        console.log(`User ${user.id} might already exist or has constraint error: ${(e as Error).message}`);
      }
    }

    // 5. Create 10 Employees
    console.log('👥 Creating 10 employees...');
    const employeeData = [
      { id: 'EMP001', name: 'Topan Rizaldi', email: 'superadmin@perusahaan.id', nik: '3201011001900001', position: 'CTO', departmentId: depts[0].id, level: 'Director', joinDate: '2020-01-01', baseSalary: 45000000, status: 'Active', userId: 'user-superadmin' },
      { id: 'EMP002', name: 'Siti Aminah', email: 'admin@perusahaan.id', nik: '3201015002920002', position: 'HR Manager', departmentId: depts[1].id, level: 'Manager', joinDate: '2021-03-15', baseSalary: 25000000, status: 'Active', userId: 'user-admin' },
      { id: 'EMP003', name: 'Budi Santoso', email: 'budi.santoso@perusahaan.id', nik: '3201011203880003', position: 'Senior Developer', departmentId: depts[0].id, level: 'Senior', joinDate: '2022-06-01', baseSalary: 20000000, status: 'Active', userId: 'user-employee' },
      { id: 'EMP004', name: 'Dewi Lestari', email: 'dewi.lestari@perusahaan.id', nik: '3201014504950004', position: 'UI/UX Designer', departmentId: depts[0].id, level: 'Middle', joinDate: '2022-08-10', baseSalary: 15000000, status: 'Active' },
      { id: 'EMP005', name: 'Eko Prasetyo', email: 'eko.prasetyo@perusahaan.id', nik: '3201011805930005', position: 'Product Manager', departmentId: depts[2].id, level: 'Manager', joinDate: '2021-11-20', baseSalary: 22000000, status: 'Active' },
      { id: 'EMP006', name: 'Fitri Yani', email: 'fitri.yani@perusahaan.id', nik: '3201015206960006', position: 'Marketing Specialist', departmentId: depts[3].id, level: 'Middle', joinDate: '2023-02-01', baseSalary: 12000000, status: 'Active' },
      { id: 'EMP007', name: 'Guruh Putra', email: 'guruh.putra@perusahaan.id', nik: '3201012107940007', position: 'Operations Lead', departmentId: depts[4].id, level: 'Manager', joinDate: '2022-01-15', baseSalary: 18000000, status: 'Active' },
      { id: 'EMP008', name: 'Hana Maria', email: 'hana.maria@perusahaan.id', nik: '3201014908970008', position: 'QA Engineer', departmentId: depts[0].id, level: 'Middle', joinDate: '2023-05-20', baseSalary: 13000000, status: 'Active' },
      { id: 'EMP009', name: 'Indra Wijaya', email: 'indra.wijaya@perusahaan.id', nik: '3201012509910009', position: 'System Architect', departmentId: depts[0].id, level: 'Senior', joinDate: '2021-02-10', baseSalary: 28000000, status: 'Active' },
      { id: 'EMP010', name: 'Joko Susilo', email: 'joko.susilo@perusahaan.id', nik: '3201011510890010', position: 'Backend Developer', departmentId: depts[0].id, level: 'Junior', joinDate: '2024-01-05', baseSalary: 9000000, status: 'Active' },
    ];

    // Insert employees one by one to avoid bulk insert issues
    const createdEmployees: (typeof schema.employees.$inferSelect)[] = [];
    for (const emp of employeeData) {
      try {
        const result = await db.insert(schema.employees).values(emp).returning();
        createdEmployees.push(result[0]);
      } catch (e) {
        console.log(`Failed to insert employee ${emp.id}: ${(e as Error).message}`);
      }
    }

    if (createdEmployees.length === 0) {
      throw new Error("No employees were created. Seeding cannot continue.");
    }

    // 6. Create Contracts
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
      { code: 'CL-002', name: 'Global Finance Ltd', industry: 'Banking', active: true }
    ]).returning();

    const projectList = await db.insert(schema.projects).values([
      { name: 'Cloud Migration', clientId: clientList[0].id, status: 'Active', startDate: '2023-10-01' },
      { name: 'Fintech App Mobile', clientId: clientList[1].id, status: 'Active', startDate: '2024-01-15' }
    ]).returning();

    // Assign Engineering team to projects
    const engEmployees = createdEmployees.filter(e => e.departmentId === depts[0].id);
    const assignmentData = engEmployees.map((emp, idx) => ({
      employeeId: emp.id,
      projectId: projectList[idx % 2].id,
      departmentId: emp.departmentId,
      role: emp.position,
      startDate: '2024-01-01',
      allocation: 100
    }));
    if (assignmentData.length > 0) await db.insert(schema.assignments).values(assignmentData);

    // 8. Attendance (Last 7 days)
    console.log('📅 Creating attendance logs...');
    const attendanceLogs: (typeof schema.attendances.$inferInsert)[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

      for (const emp of createdEmployees) {
        attendanceLogs.push({
          employeeId: emp.id,
          date: dateStr,
          checkInTime: new Date(dateStr + 'T08:05:00Z'),
          checkOutTime: new Date(dateStr + 'T17:15:00Z'),
          status: 'Present'
        });
      }
    }
    if (attendanceLogs.length > 0) await db.insert(schema.attendances).values(attendanceLogs);

    // 9. Leave Requests
    console.log('🏖️ Creating leave requests...');
    const leaveData = [
      { id: 'LV-0001', employeeId: 'EMP003', type: 'Annual Leave', startDate: '2024-05-10', endDate: '2024-05-12', status: 'Approved', reason: 'Vacation' },
      { id: 'LV-0002', employeeId: 'EMP004', type: 'Sick Leave', startDate: '2024-05-01', endDate: '2024-05-01', status: 'Approved', reason: 'Fever' },
    ].filter(l => createdEmployees.some(e => e.id === l.employeeId));
    if (leaveData.length > 0) await db.insert(schema.leaveRequests).values(leaveData);

    // 10. Overtime
    console.log('🌙 Creating overtime requests...');
    const overtimeData = [
      { id: 'OVT-0001', employeeId: 'EMP003', date: '2024-05-05', startTime: '17:00', endTime: '20:00', hours: '3', status: 'Approved', task: 'Bug fixing for production release', achievement: 'Completed' },
      { id: 'OVT-0002', employeeId: 'EMP004', date: '2024-05-05', startTime: '17:00', endTime: '19:00', hours: '2', status: 'Approved', task: 'Design assets finalization', achievement: 'Completed' },
    ].filter(o => createdEmployees.some(e => e.id === o.employeeId));
    if (overtimeData.length > 0) await db.insert(schema.overtimeRequests).values(overtimeData);

    // 11. Recruitment
    console.log('🎯 Creating recruitment data...');
    const opening = await db.insert(schema.jobOpenings).values({
      title: 'Senior Frontend Developer (React)',
      departmentId: depts[0].id,
      type: 'Full-time',
      location: 'Jakarta (Remote)',
      status: 'Open'
    }).returning();

    await db.insert(schema.candidates).values([
      { jobId: opening[0].id, name: 'Kevin Durant', email: 'kevin.d@gmail.com', stage: 'Interview', rating: '4.5' },
      { jobId: opening[0].id, name: 'Stephen Curry', email: 'steph.c@gmail.com', stage: 'Applied', rating: '4.0' },
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
      { employeeId: 'EMP003', title: 'Monitor 4K', amount: 4500000, type: 'Other', status: 'Approved', description: 'Equipment for remote work' },
      { employeeId: 'EMP004', title: 'Internet Subscription', amount: 500000, type: 'Other', status: 'Pending', description: 'Monthly allowance' },
    ].filter(r => createdEmployees.some(e => e.id === r.employeeId));
    if (reimbursementData.length > 0) await db.insert(schema.reimbursements).values(reimbursementData);

    // 14. Announcements
    console.log('📢 Creating announcements...');
    const announcementData = [
      { title: 'Welcome to the New HRIS System!', content: 'We are excited to announce the launch of our new HRIS system. This platform will streamline all HR processes and improve employee experience.', priority: 'High', createdBy: 'EMP001' },
      { title: 'Monthly Team Meeting', content: 'Reminder: Monthly team meeting will be held on the first Monday of each month at 10 AM. Please prepare your updates.', priority: 'Normal', createdBy: 'EMP002' },
      { title: 'Holiday Schedule Update', content: 'Due to the upcoming national holiday, the office will be closed on May 25th. Please plan accordingly.', priority: 'Normal', createdBy: 'EMP002' },
    ].filter(a => createdEmployees.some(e => e.id === a.createdBy));
    if (announcementData.length > 0) await db.insert(schema.announcements).values(announcementData);

    // 15. Performance
    console.log('📈 Creating performance assessments...');
    const track = await db.insert(schema.careerTracks).values({ name: 'Technical' }).returning();
    await db.insert(schema.careerLevels).values([
      { trackId: track[0].id, level: 1, title: 'Junior Engineer', salaryRange: '8M - 12M' },
      { trackId: track[0].id, level: 2, title: 'Middle Engineer', salaryRange: '13M - 18M' },
      { trackId: track[0].id, level: 3, title: 'Senior Engineer', salaryRange: '20M - 35M' },
    ]);

    const assessmentEmp = createdEmployees.find(e => e.id === 'EMP003');
    if (assessmentEmp) {
      const assess = await db.insert(schema.assessments).values({
        employeeId: 'EMP003',
        period: 'Q1 2024',
        status: 'Completed',
        overallScore: '4.2'
      }).returning();

      await db.insert(schema.assessmentScores).values([
        { assessmentId: assess[0].id, competency: 'Technical Skill', managerScore: '4.5', peerScore: '4.0' },
        { assessmentId: assess[0].id, competency: 'Communication', managerScore: '3.8', peerScore: '4.2' },
      ]);
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    process.exit(0);
  }
}

main().catch(console.error);
