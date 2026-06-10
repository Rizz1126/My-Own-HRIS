import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { users, employees, departments } from '../../db/schema.js';

export class UserService {
  static async getAllUsers() {
    return await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastLogin: users.updatedAt,
      isActive: employees.status,
      employeeId: employees.id,
      department: departments.name
    })
    .from(users)
    .leftJoin(employees, eq(users.id, employees.userId))
    .leftJoin(departments, eq(employees.departmentId, departments.id));
  }

  static async updateRole(userId: string, role: string) {
    const result = await db.update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }
}
