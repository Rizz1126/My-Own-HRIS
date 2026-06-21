import { eq, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { employees, departments, assignments, projects, clients, contracts } from '../../db/schema.js';

export class EmployeeService {
  static async getAllEmployees() {
    const results = await db.select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      nik: employees.nik,
      position: employees.position,
      level: employees.level,
      status: employees.status,
      joinDate: employees.joinDate,
      baseSalary: employees.baseSalary,
      bio: employees.bio,
      phone: employees.phone,
      address: employees.address,
      dateOfBirth: employees.dateOfBirth,
      emergencyContact: employees.emergencyContact,
      emergencyPhone: employees.emergencyPhone,
      skills: employees.skills,
      maritalStatus: employees.maritalStatus,
      department: {
        id: departments.id,
        name: departments.name,
        colorCode: departments.colorCode
      },
      projectName: projects.name,
      contractEndDate: contracts.endDate
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(assignments, sql`${employees.id} = ${assignments.employeeId} AND ${assignments.active} = true`)
    .leftJoin(projects, eq(assignments.projectId, projects.id))
    .leftJoin(contracts, sql`${employees.id} = ${contracts.employeeId} AND ${contracts.id} = (SELECT id FROM ${contracts} WHERE employee_id = ${employees.id} ORDER BY end_date DESC NULLS LAST LIMIT 1)`);

    // Deduplicate employees who might have multiple active projects (should be rare)
    const empMap = new Map();
    results.forEach(row => {
      if (!empMap.has(row.id)) {
        const emp = { ...row } as any;
        if (emp.skills) {
          try {
            emp.skills = JSON.parse(emp.skills);
          } catch {
            emp.skills = [];
          }
        }
        empMap.set(row.id, emp);
      }
    });

    return Array.from(empMap.values());
  }

  static async getEmployeeById(id: string) {
    const result = await db.select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      nik: employees.nik,
      npwp: employees.npwp,
      position: employees.position,
      level: employees.level,
      status: employees.status,
      joinDate: employees.joinDate,
      baseSalary: employees.baseSalary,
      bankAccountNumber: employees.bankAccountNumber,
      bankName: employees.bankName,
      bio: employees.bio,
      phone: employees.phone,
      address: employees.address,
      dateOfBirth: employees.dateOfBirth,
      emergencyContact: employees.emergencyContact,
      emergencyPhone: employees.emergencyPhone,
      skills: employees.skills,
      maritalStatus: employees.maritalStatus,
      userId: employees.userId,
      department: {
        id: departments.id,
        name: departments.name
      },
      projectName: projects.name,
      contractEndDate: contracts.endDate
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(assignments, sql`${employees.id} = ${assignments.employeeId} AND ${assignments.active} = true`)
    .leftJoin(projects, eq(assignments.projectId, projects.id))
    .leftJoin(contracts, sql`${employees.id} = ${contracts.employeeId} AND ${contracts.id} = (SELECT id FROM ${contracts} WHERE employee_id = ${employees.id} ORDER BY end_date DESC NULLS LAST LIMIT 1)`)
    .where(eq(employees.id, id));

    if (!result[0]) return null;

    const emp = result[0] as any;
    // Expose employeeId alias so frontend can use profile.employeeId
    emp.employeeId = emp.id;

    if (emp.skills) {
      try {
        emp.skills = JSON.parse(emp.skills);
      } catch {
        emp.skills = [];
      }
    }

    return emp;
  }

  static async generateNik() {
    // Find the latest employee by NIK
    const latest = await db.select({ nik: employees.nik })
      .from(employees)
      .where(sql`${employees.nik} LIKE 'EMP%'`)
      .orderBy(sql`${employees.nik} DESC`)
      .limit(1);
    
    let nextNum = 1;
    if (latest.length > 0 && latest[0].nik) {
      const match = latest[0].nik.match(/EMP(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    return `EMP${nextNum.toString().padStart(3, '0')}`;
  }

  static async createEmployee(data: typeof employees.$inferInsert) {
    if (!data.nik) {
      data.nik = await this.generateNik();
    }
    const result = await db.insert(employees).values(data).returning();
    return result[0];
  }

  static async updateEmployee(id: string, data: Partial<typeof employees.$inferInsert>) {
    const updateData = { ...data };
    if (updateData.skills && Array.isArray(updateData.skills)) {
      (updateData as any).skills = JSON.stringify(updateData.skills);
    }
    const result = await db.update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return result[0];
  }

  static async getEmployeesByDepartment(deptId: string) {
    return await db.select()
      .from(employees)
      .where(eq(employees.departmentId, deptId));
  }

  static async getAssignmentsByEmployee(employeeId: string) {
    return await db.select({
      id: assignments.id,
      role: assignments.role,
      startDate: assignments.startDate,
      endDate: assignments.endDate,
      allocation: assignments.allocation,
      active: assignments.active,
      project: {
        name: projects.name
      },
      department: {
        name: departments.name
      },
      client: {
        name: clients.name
      }
    })
    .from(assignments)
    .leftJoin(projects, eq(assignments.projectId, projects.id))
    .leftJoin(departments, eq(assignments.departmentId, departments.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(assignments.employeeId, employeeId));
  }
}

