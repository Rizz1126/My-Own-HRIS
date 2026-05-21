import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { payslips, employees, departments } from '../../db/schema';

export class PayrollService {
  static async getAllPayslips() {
    return await db.select({
      id: payslips.id,
      periodMonth: payslips.periodMonth,
      periodYear: payslips.periodYear,
      baseSalary: payslips.baseSalary,
      allowancesTotal: payslips.allowancesTotal,
      deductionsTotal: payslips.deductionsTotal,
      netPay: payslips.netPay,
      status: payslips.status,
      employee: {
        id: employees.id,
        nik: employees.nik,
        name: employees.name,
        position: employees.position,
        department: departments.name
      }
    })
    .from(payslips)
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id));
  }

  static async getPayslipsByEmployee(employeeId: string) {
    return await db.select({
      id: payslips.id,
      periodMonth: payslips.periodMonth,
      periodYear: payslips.periodYear,
      baseSalary: payslips.baseSalary,
      allowancesTotal: payslips.allowancesTotal,
      deductionsTotal: payslips.deductionsTotal,
      netPay: payslips.netPay,
      status: payslips.status,
      employee: {
        id: employees.id,
        name: employees.name,
        position: employees.position,
        department: departments.name,
        bankName: employees.bankName,
        bankAccountNumber: employees.bankAccountNumber,
      }
    })
    .from(payslips)
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(payslips.employeeId, employeeId));
  }

  static async generatePayslip(data: typeof payslips.$inferInsert) {
    // In a real application, you might automatically compute deductions and netPay here
    const result = await db.insert(payslips).values(data).returning();
    return result[0];
  }

  static async updatePayslipStatus(id: string, status: string) {
    const result = await db.update(payslips)
      .set({ status })
      .where(eq(payslips.id, id))
      .returning();
    return result[0];
  }
}
