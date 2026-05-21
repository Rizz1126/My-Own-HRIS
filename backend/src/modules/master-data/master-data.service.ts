import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { contracts, projects, clients, employees, assignments, departments } from '../../db/schema';

export class MasterDataService {
  // Contracts
  static async getAllContracts() {
    return await db.select({
      id: contracts.id,
      type: contracts.type,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      documentUrl: contracts.documentUrl,
      employee: {
        id: employees.id,
        name: employees.name,
        nik: employees.nik,
        position: employees.position
      }
    })
    .from(contracts)
    .leftJoin(employees, eq(contracts.employeeId, employees.id));
  }

  static async createContract(data: typeof contracts.$inferInsert) {
    const result = await db.insert(contracts).values(data).returning();
    return result[0];
  }

  static async updateContract(id: string, data: { type?: string; startDate?: string; endDate?: string | null; documentUrl?: string | null }) {
    const result = await db.update(contracts).set(data).where(eq(contracts.id, id)).returning();
    return result[0];
  }

  static async deleteContract(id: string) {
    const result = await db.delete(contracts).where(eq(contracts.id, id)).returning();
    return result[0];
  }

  // Clients
  static async getAllClients() {
    return await db.select().from(clients);
  }

  static async createClient(data: typeof clients.$inferInsert) {
    const result = await db.insert(clients).values(data).returning();
    return result[0];
  }

  static async deleteClient(id: string) {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result[0];
  }

  static async updateClient(id: string, data: { code?: string; clientName?: string; name?: string; active?: boolean }) {
    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.clientName !== undefined) updateData.name = data.clientName;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.active !== undefined) updateData.active = data.active;
    const result = await db.update(clients).set(updateData).where(eq(clients.id, id)).returning();
    return result[0];
  }

  // Projects
  static async getAllProjects() {
    return await db.select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      startDate: projects.startDate,
      endDate: projects.endDate,
      client: {
        id: clients.id,
        name: clients.name
      }
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id));
  }

  static async createProject(data: typeof projects.$inferInsert) {
    const result = await db.insert(projects).values(data).returning();
    return result[0];
  }

  static async deleteProject(id: string) {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result[0];
  }

  static async updateProject(id: string, data: {
    name?: string;
    clientId?: string | null;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
  }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    const result = await db.update(projects).set(updateData).where(eq(projects.id, id)).returning();
    return result[0];
  }

  // Assignments
  static async getAllAssignments() {
    return await db.select({
      id: assignments.id,
      role: assignments.role,
      startDate: assignments.startDate,
      endDate: assignments.endDate,
      allocation: assignments.allocation,
      active: assignments.active,
      employee: {
        id: employees.id,
        name: employees.name,
        position: employees.position
      },
      project: {
        id: projects.id,
        name: projects.name
      },
      department: {
        id: departments.id,
        name: departments.name
      },
      client: {
        name: clients.name
      }
    })
    .from(assignments)
    .leftJoin(employees, eq(assignments.employeeId, employees.id))
    .leftJoin(projects, eq(assignments.projectId, projects.id))
    .leftJoin(departments, eq(assignments.departmentId, departments.id))
    .leftJoin(clients, eq(projects.clientId, clients.id));
  }

  static async createAssignment(data: typeof assignments.$inferInsert) {
    const result = await db.insert(assignments).values(data).returning();
    return result[0];
  }

  static async deleteAssignment(id: string) {
    const result = await db.delete(assignments).where(eq(assignments.id, id)).returning();
    return result[0];
  }

  static async updateAssignment(id: string, data: {
    employeeId?: string;
    projectId?: string | null;
    departmentId?: string | null;
    role?: string;
    startDate?: string;
    endDate?: string | null;
    allocation?: number;
    active?: boolean;
  }) {
    const updateData: any = {};
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.allocation !== undefined) updateData.allocation = data.allocation;
    if (data.active !== undefined) updateData.active = data.active;
    const result = await db.update(assignments).set(updateData).where(eq(assignments.id, id)).returning();
    return result[0];
  }

  // Departments
  static async getAllDepartments() {
    return await db.select().from(departments);
  }
}

