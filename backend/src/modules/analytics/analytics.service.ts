import { eq, sql } from 'drizzle-orm';
import { db } from '../../config/db';
import { employees, attendances, departments, payslips, contracts, projects, clients, assignments, reimbursements } from '../../db/schema';

export class AnalyticsService {
  static async getDashboardStats() {
    const allEmps = await db.select().from(employees);
    const allAttendances = await db.select().from(attendances);
    const allContracts = await db.select().from(contracts);
    const allProjects = await db.select().from(projects);
    const allClients = await db.select().from(clients);
    const allAssignments = await db.select().from(assignments);
    const allDepts = await db.select().from(departments);

    const activeEmployees = allEmps.filter(e => e.status !== 'Inactive' && e.status !== 'Resigned').length;
    
    // Real Attendance Rate calculation (last 7 days)
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
        last7Days.push(d.toISOString().split('T')[0]);
      }
    }
    
    let totalPossible = last7Days.length * activeEmployees;
    let actualAttendances = allAttendances.filter(a => last7Days.includes(a.date)).length;
    const attendanceRate = totalPossible > 0 ? (actualAttendances / totalPossible) * 100 : 0;

    const expiringSoonCount = allContracts.filter(c => {
      if (!c.endDate) return false;
      const end = new Date(c.endDate);
      const diff = end.getTime() - Date.now();
      const days = diff / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 60;
    }).length;

    const activeProjectCount = allProjects.filter(p => p.status === 'Active').length;
    const activeClientCount = allClients.length;
    const presentCount = allAttendances.filter(a => {
       const today = new Date().toISOString().split('T')[0];
       return a.date === today && (a.status === 'Present' || a.status === 'Late');
    }).length;

    // Headcount trend
    const headcountTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      headcountTrend.push({
        month: d.toLocaleString('default', { month: 'short' }),
        count: activeEmployees - (i * 2) // Mocked trend
      });
    }

    // Dept stats
    const departmentStats = allDepts.map(d => ({
      name: d.name,
      count: allEmps.filter(e => e.departmentId === d.id).length,
      color: d.colorCode || '#6366F1'
    })).filter(d => d.count > 0);

    // Cost vs Revenue (Mocked)
    const costRevenueData = headcountTrend.map((h, i) => ({
      month: h.month,
      cost: 450000000 + (i * 10000000),
      revenue: 600000000 + (i * 15000000)
    }));

    // Contract Summary
    const contractSummary = {
      active: allContracts.filter(c => !c.endDate || new Date(c.endDate).getTime() >= Date.now()).length,
      expiringSoon: expiringSoonCount,
      expired: allContracts.filter(c => c.endDate && new Date(c.endDate).getTime() < Date.now()).length
    };

    // Allocation Data
    const allocationData = allDepts.map(d => {
      const deptAssignments = allAssignments.filter(a => a.departmentId === d.id);
      const totalAllocation = deptAssignments.reduce((s, a) => s + (a.allocation || 0), 0);
      return {
        project: d.name,
        allocation: totalAllocation
      };
    }).filter(a => a.allocation > 0).sort((a, b) => b.allocation - a.allocation).slice(0, 6);

    return {
      activeEmployees,
      attendanceRate,
      presentCount,
      expiringSoonCount,
      activeProjectCount,
      activeClientCount,
      headcountTrend,
      departmentStats,
      costRevenueData,
      contractSummary,
      allocationData,
      contracts: allContracts.map(c => ({
         ...c,
         name: allEmps.find(e => e.id === c.employeeId)?.name || 'Unknown',
         status: (!c.endDate || new Date(c.endDate).getTime() >= Date.now()) ? 'Active' : 'Expired'
      })),
      projects: allProjects.map(p => ({
         ...p,
         projectName: p.name,
         client: allClients.find(cl => cl.id === p.clientId)?.name || 'Unknown'
      }))
    };
  }

  static async getTurnoverData() {
    const allEmps = await db.select().from(employees);
    
    // Group joins and exits by month (last 12 months)
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const joined = allEmps.filter(e => e.joinDate && String(e.joinDate).startsWith(yearMonth)).length;
      const left = allEmps.filter(e => e.exitDate && String(e.exitDate).startsWith(yearMonth)).length;
      
      months.push({ month: monthStr, joined, left });
    }

    return months;
  }

  static async getAttendanceHeatmap() {
    // Aggregation of check-in hours across days of week
    const records = await db.select({
      checkInTime: attendances.checkInTime,
      date: attendances.date
    }).from(attendances);

    // Day mapping: 0-6 (Sun-Sat)
    // Hour mapping: 0-23
    const heatmap = Array(7).fill(0).map(() => Array(24).fill(0));

    records.forEach(r => {
      if (!r.checkInTime) return;
      const d = new Date(r.checkInTime);
      const day = d.getDay();
      const hour = d.getHours();
      heatmap[day][hour]++;
    });

    return heatmap;
  }

  static async getCostPrediction() {
    // 1. Fetch Salary History
    const salaryHistory = await db.select({
      total: sql<number>`sum(${payslips.netPay})`,
      month: payslips.periodMonth,
      year: payslips.periodYear
    })
    .from(payslips)
    .groupBy(payslips.periodMonth, payslips.periodYear)
    .orderBy(payslips.periodYear, payslips.periodMonth);

    const history = salaryHistory.map(h => ({
      ...h,
      total: Number(h.total || 0)
    }));

    // 2. Fetch Approved Reimbursements
    const approvedReimbursements = await db.select({
      total: sql<number>`sum(${reimbursements.amount})`,
    })
    .from(reimbursements)
    .where(sql`${reimbursements.status} IN ('Approved', 'Paid')`);

    const reimbursementTotal = Number(approvedReimbursements[0]?.total || 0);

    // 3. Generate 6 months of predictions
    const predictions = [];
    const allEmps = await db.select().from(employees);
    const baseSalaryTotal = allEmps.reduce((acc, e) => acc + Number(e.baseSalary || 0), 0);
    const lastTotal = history.length > 0 ? Number(history[history.length - 1].total) : baseSalaryTotal * 1.1;
    
    for (let i = 1; i <= 6; i++) {
      predictions.push({
        month: `Month +${i}`,
        predicted: Math.round(lastTotal * (1 + (i * 0.02))), // 2% monthly growth
        actual: null
      });
    }

    const costBreakdown = [
      { category: 'Base Salary', current: Math.round(baseSalaryTotal / 1000000), projected: Math.round((baseSalaryTotal * 1.05) / 1000000) },
      { category: 'Allowances', current: 85, projected: 90 },
      { category: 'Overtime', current: 45, projected: 55 },
      { category: 'Benefits', current: 65, projected: 70 },
      { category: 'Taxes', current: 32, projected: 35 },
      { category: 'Reimbursements', current: Math.round(reimbursementTotal / 1000000), projected: Math.round((reimbursementTotal * 1.1) / 1000000) },
    ];

    return { history, predictions, costBreakdown };
  }


  static async getTurnoverBreakdown() {
    const depts = await db.select().from(departments);
    const emps = await db.select().from(employees);

    const departmentTurnover = depts.map(d => {
      const deptEmps = emps.filter(e => e.departmentId === d.id);
      const left = deptEmps.filter(e => e.exitDate).length;
      return {
        name: d.name,
        value: left
      };
    }).filter(d => d.value > 0);

    const exitReasons = [
      { name: 'Better Opportunity', value: 45 },
      { name: 'Career Change', value: 20 },
      { name: 'Personal/Family', value: 15 },
      { name: 'Compensation', value: 12 },
      { name: 'Relocation', value: 8 },
    ];

    return { departmentTurnover, exitReasons };
  }
}

