import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { reimbursements, employees, users, announcements, notifications } from '../../db/schema.js';

export class EssService {
  static async getReimbursements(employeeId?: string) {
    let query = db.select({
      id: reimbursements.id,
      title: reimbursements.title,
      amount: reimbursements.amount,
      type: reimbursements.type,
      status: reimbursements.status,
      requestDate: reimbursements.requestDate,
      receiptUrl: reimbursements.receiptUrl,
      description: reimbursements.description,
      employeeName: employees.name,
    })
    .from(reimbursements)
    .leftJoin(employees, eq(reimbursements.employeeId, employees.id))
    .orderBy(desc(reimbursements.requestDate));

    if (employeeId) {
      // @ts-ignore
      query = query.where(eq(reimbursements.employeeId, employeeId));
    }

    return await query;
  }

  static async createReimbursement(data: typeof reimbursements.$inferInsert) {
    const BUDGET_LIMIT = 10000000;
    
    // Calculate current usage for the year
    const usage = await db.select({
      total: sql<number>`sum(${reimbursements.amount})`,
    })
    .from(reimbursements)
    .where(sql`${reimbursements.employeeId} = ${data.employeeId} AND ${reimbursements.status} != 'Rejected'`);

    const currentTotal = Number(usage[0]?.total || 0);
    const requestedAmount = Number(data.amount || 0);

    if (currentTotal + requestedAmount > BUDGET_LIMIT) {
      throw new Error(`Insufficient budget. Your remaining annual budget is ${10000000 - currentTotal}. Requested: ${requestedAmount}`);
    }

    const result = await db.insert(reimbursements).values(data).returning();
    return result[0];
  }

  static async updateProfile(id: string, data: any) {
    // 1. Extract only the fields that belong to the employees table
    const updateData: any = {};
    const allowedFields = [
      'email', 'nik', 'npwp', 'position', 'departmentId', 'level',
      'status', 'joinDate', 'exitDate', 'baseSalary', 'bankAccountNumber',
      'bankName', 'bio', 'phone', 'address', 'dateOfBirth',
      'emergencyContact', 'emergencyPhone', 'skills', 'maritalStatus'
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        // Convert empty strings to null to avoid DB type errors (e.g., date columns)
        const val = data[field];
        updateData[field] = val === '' ? null : val;
      }
    });

    // Handle skills as JSON string if it's an array
    if (updateData.skills && Array.isArray(updateData.skills)) {
      updateData.skills = JSON.stringify(updateData.skills);
    }

    // 2. Update Employee record
    const result = await db.update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Employee not found');
    }

    // 3. Name update is restricted from ESS; must be done by Admin via Employee Service.

    // 4. Log notification for Admin/HR
    const empName = result[0].name || 'An employee';
    await db.insert(notifications).values({
      type: 'profile_update',
      title: 'Profile Updated',
      message: `${empName} has updated their profile details.`,
      targetRole: 'Admin', // Also could be HR, but Admin/Superadmin as requested
    });

    return result[0];
  }

  static async getAnnouncements() {
    return await db.select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      priority: announcements.priority,
      createdBy: announcements.createdBy,
      createdAt: announcements.createdAt,
      isActive: announcements.isActive,
      creatorName: employees.name,
    })
    .from(announcements)
    .leftJoin(employees, eq(announcements.createdBy, employees.id))
    .where(eq(announcements.isActive, true))
    .orderBy(desc(announcements.createdAt));
  }

  static async createAnnouncement(data: typeof announcements.$inferInsert) {
    const result = await db.insert(announcements).values(data).returning();
    return result[0];
  }

  static async updateAnnouncement(id: string, data: Partial<typeof announcements.$inferInsert>) {
    const result = await db.update(announcements)
      .set(data)
      .where(eq(announcements.id, id))
      .returning();
    return result[0];
  }

  static async deleteAnnouncement(id: string) {
    await db.update(announcements)
      .set({ isActive: false })
      .where(eq(announcements.id, id));
  }

  static async getAdminNotifications() {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.targetRole, 'Admin'))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }
}

