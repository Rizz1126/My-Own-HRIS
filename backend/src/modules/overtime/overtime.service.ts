import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { overtimeRequests, overtimeBatches, employees } from '../../db/schema';

export class OvertimeService {
  // Requests
  static async getAllRequests() {
    return await db.select({
      id: overtimeRequests.id,
      date: overtimeRequests.date,
      startTime: overtimeRequests.startTime,
      endTime: overtimeRequests.endTime,
      hours: overtimeRequests.hours,
      task: overtimeRequests.task,
      achievement: overtimeRequests.achievement,
      progressDetails: overtimeRequests.progressDetails,
      evidenceUrl: overtimeRequests.evidenceUrl,
      status: overtimeRequests.status,
      isWeekend: overtimeRequests.isWeekend,
      createdAt: overtimeRequests.createdAt,
      employee: {
        id: employees.id,
        name: employees.name,
        nik: employees.nik,
        position: employees.position,
        baseSalary: employees.baseSalary
      }
    })
    .from(overtimeRequests)
    .leftJoin(employees, eq(overtimeRequests.employeeId, employees.id));
  }

  static async getRequestsByEmployee(employeeId: string) {
    return await db.select()
      .from(overtimeRequests)
      .where(eq(overtimeRequests.employeeId, employeeId));
  }

  static async createRequest(data: any) {
    const result = await db.insert(overtimeRequests).values(data).returning();
    return result[0];
  }

  static async updateRequestStatus(id: string, status: string) {
    const result = await db.update(overtimeRequests)
      .set({ status })
      .where(eq(overtimeRequests.id, id))
      .returning();
    return result[0];
  }

  // AI Evidence Analysis (Mock)
  static async analyzeEvidence(fileUrl: string) {
    // This is a mock implementation that simulates AI parsing an evidence document
    // In a real scenario, this would call Gemini API or an OCR service
    
    // Simulating a delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return mocked extracted data
    return {
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '21:00',
      hours: '3',
      task: 'Migrasi database dan optimasi query untuk modul payroll',
      achievement: 'Completed',
      progressDetails: 'Semua tabel berhasil dimigrasi dan query dipercepat hingga 40%',
      isWeekend: false
    };
  }

  // Batches
  static async getAllBatches() {
    return await db.select().from(overtimeBatches);
  }

  static async createBatch(data: typeof overtimeBatches.$inferInsert) {
    const result = await db.insert(overtimeBatches).values(data).returning();
    return result[0];
  }
}
