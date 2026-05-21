import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../config/db';
import { attendances, employees, shifts, employeeSchedules, leaveRequests, departments } from '../../db/schema';

export class AttendanceService {
  static async getTodayAttendance(date: string) {
    return await db.select({
      id: attendances.id,
      date: attendances.date,
      checkInTime: attendances.checkInTime,
      checkOutTime: attendances.checkOutTime,
      status: attendances.status,
      employee: {
        id: employees.id,
        nik: employees.nik,
        position: employees.position
      }
    })
    .from(attendances)
    .leftJoin(employees, eq(attendances.employeeId, employees.id))
    .where(eq(attendances.date, date));
  }

  static async checkIn(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    // Simple check to prevent double check-in
    const existing = await db.select()
      .from(attendances)
      .where(and(eq(attendances.employeeId, employeeId), eq(attendances.date, today)));

    if (existing.length > 0) {
      throw new Error('Already checked in today');
    }

    const result = await db.insert(attendances).values({
      employeeId,
      date: today,
      checkInTime: new Date(),
      status: 'Present' // Simplistic logic: late status would be determined by time
    }).returning();
    
    return result[0];
  }

  static async checkOut(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.update(attendances)
      .set({ checkOutTime: new Date() })
      .where(and(eq(attendances.employeeId, employeeId), eq(attendances.date, today)))
      .returning();
      
    return result[0];
  }

  // --- SHIFTS & SCHEDULES ---
  
  static async getShifts() {
    return await db.select().from(shifts);
  }

  static async getSchedules() {
    return await db.select({
      id: employeeSchedules.id,
      date: employeeSchedules.date,
      shift: {
        id: shifts.id,
        name: shifts.name,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        color: shifts.color,
      },
      employee: {
        id: employees.id,
        name: employees.name,
        department: departments.name,
      }
    })
    .from(employeeSchedules)
    .leftJoin(shifts, eq(employeeSchedules.shiftId, shifts.id))
    .leftJoin(employees, eq(employeeSchedules.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id));
  }

  // --- LEAVE REQUESTS ---

  static async getLeaves() {
    return await db.select({
      id: leaveRequests.id,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      status: leaveRequests.status,
      reason: leaveRequests.reason,
      employee: {
        id: employees.id,
        name: employees.name,
        department: departments.name,
      }
    })
    .from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .orderBy(desc(leaveRequests.startDate));
  }

  static async createLeave(data: typeof leaveRequests.$inferInsert) {
    const result = await db.insert(leaveRequests).values(data).returning();
    return result[0];
  }

  static async updateLeaveStatus(id: string, status: string) {
    const result = await db.update(leaveRequests)
      .set({ status })
      .where(eq(leaveRequests.id, id))
      .returning();
    return result[0];
  }

  // --- ROOMS / DEPARTMENTS ---

  static async getRoomMembers(departmentId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all employees in department
    const deptEmployees = await db.select({
      id: employees.id,
      name: employees.name,
      position: employees.position,
    })
    .from(employees)
    .where(eq(employees.departmentId, departmentId));

    // Get attendance for today
    const attendanceRecords = await db.select()
      .from(attendances)
      .where(eq(attendances.date, today));

    const attendanceMap = new Map(attendanceRecords.map(r => [r.employeeId, r]));

    return deptEmployees.map(emp => {
      const att = attendanceMap.get(emp.id);
      return {
        ...emp,
        isInRoom: !!att?.checkInTime && !att?.checkOutTime,
        status: att ? att.status : 'Absent',
        checkIn: att?.checkInTime,
        checkOut: att?.checkOutTime,
      };
    });
  }
}
