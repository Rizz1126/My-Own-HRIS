import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { objectives, keyResults, okrCheckIns, okrAlignments, employees, departments } from '../../db/schema.js';

export class OKRService {
  // ──────────────── OBJECTIVES ────────────────

  static async getAllObjectives(period?: string, level?: string) {
    let query = db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      level: objectives.level,
      period: objectives.period,
      status: objectives.status,
      progress: objectives.progress,
      parentObjectiveId: objectives.parentObjectiveId,
      ownerId: objectives.ownerId,
      ownerName: employees.name,
      ownerPosition: employees.position,
      departmentId: objectives.departmentId,
      departmentName: departments.name,
      createdAt: objectives.createdAt,
      updatedAt: objectives.updatedAt,
    })
    .from(objectives)
    .leftJoin(employees, eq(objectives.ownerId, employees.id))
    .leftJoin(departments, eq(objectives.departmentId, departments.id))
    .$dynamic();

    const conditions = [];
    if (period) conditions.push(eq(objectives.period, period));
    if (level) conditions.push(eq(objectives.level, level));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  static async getObjectiveTree(period: string) {
    // Fetch all objectives for the period
    const allObjectives = await this.getAllObjectives(period);

    // Fetch all key results for these objectives
    const objectiveIds = allObjectives.map(o => o.id);
    let allKRs: any[] = [];
    if (objectiveIds.length > 0) {
      allKRs = await db.select().from(keyResults)
        .where(inArray(keyResults.objectiveId, objectiveIds));
    }

    // Fetch all alignments
    let allAlignments: any[] = [];
    if (objectiveIds.length > 0) {
      allAlignments = await db.select().from(okrAlignments)
        .where(inArray(okrAlignments.childObjectiveId, objectiveIds));
    }

    // Build tree structure
    const objectivesWithKRs = allObjectives.map(obj => ({
      ...obj,
      keyResults: allKRs.filter(kr => kr.objectiveId === obj.id),
      children: [] as any[],
    }));

    // Separate by level
    const company = objectivesWithKRs.filter(o => o.level === 'company');
    const department = objectivesWithKRs.filter(o => o.level === 'department');
    const individual = objectivesWithKRs.filter(o => o.level === 'individual');

    // Link children via alignments + parentObjectiveId
    const linkChildren = (parent: any) => {
      // Children linked by parentObjectiveId
      const directChildren = objectivesWithKRs.filter(o => o.parentObjectiveId === parent.id);
      // Children linked via alignment table
      const alignedChildIds = allAlignments
        .filter(a => a.parentObjectiveId === parent.id)
        .map(a => a.childObjectiveId);
      const alignedChildren = objectivesWithKRs.filter(o => alignedChildIds.includes(o.id));

      const allChildren = [...directChildren];
      alignedChildren.forEach(c => {
        if (!allChildren.find(x => x.id === c.id)) allChildren.push(c);
      });

      parent.children = allChildren.map(child => ({
        ...child,
        children: linkChildren(child),
      }));
      return parent.children;
    };

    company.forEach(c => linkChildren(c));

    return {
      company,
      department,
      individual,
      tree: company, // hierarchical starting from company level
    };
  }

  static async getObjectiveById(id: string) {
    const [obj] = await db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      level: objectives.level,
      period: objectives.period,
      status: objectives.status,
      progress: objectives.progress,
      parentObjectiveId: objectives.parentObjectiveId,
      ownerId: objectives.ownerId,
      ownerName: employees.name,
      ownerPosition: employees.position,
      departmentId: objectives.departmentId,
      departmentName: departments.name,
      createdAt: objectives.createdAt,
      updatedAt: objectives.updatedAt,
    })
    .from(objectives)
    .leftJoin(employees, eq(objectives.ownerId, employees.id))
    .leftJoin(departments, eq(objectives.departmentId, departments.id))
    .where(eq(objectives.id, id));

    if (!obj) return null;

    const krs = await db.select().from(keyResults)
      .where(eq(keyResults.objectiveId, id));

    // Get check-ins for each KR
    const krsWithHistory = await Promise.all(krs.map(async (kr) => {
      const checkIns = await db.select({
        id: okrCheckIns.id,
        value: okrCheckIns.value,
        comment: okrCheckIns.comment,
        confidence: okrCheckIns.confidence,
        createdBy: okrCheckIns.createdBy,
        createdByName: employees.name,
        createdAt: okrCheckIns.createdAt,
      })
      .from(okrCheckIns)
      .leftJoin(employees, eq(okrCheckIns.createdBy, employees.id))
      .where(eq(okrCheckIns.keyResultId, kr.id))
      .orderBy(desc(okrCheckIns.createdAt));

      return { ...kr, checkIns };
    }));

    // Get child objectives (aligned)
    const childAlignments = await db.select().from(okrAlignments)
      .where(eq(okrAlignments.parentObjectiveId, id));
    const childIds = childAlignments.map(a => a.childObjectiveId);

    // Also get direct children via parentObjectiveId
    const directChildren = await db.select({
      id: objectives.id,
      title: objectives.title,
      level: objectives.level,
      progress: objectives.progress,
      status: objectives.status,
      ownerName: employees.name,
    })
    .from(objectives)
    .leftJoin(employees, eq(objectives.ownerId, employees.id))
    .where(eq(objectives.parentObjectiveId, id));

    let alignedChildren: any[] = [];
    if (childIds.length > 0) {
      alignedChildren = await db.select({
        id: objectives.id,
        title: objectives.title,
        level: objectives.level,
        progress: objectives.progress,
        status: objectives.status,
        ownerName: employees.name,
      })
      .from(objectives)
      .leftJoin(employees, eq(objectives.ownerId, employees.id))
      .where(inArray(objectives.id, childIds));
    }

    const allChildObjectives = [...directChildren];
    alignedChildren.forEach(c => {
      if (!allChildObjectives.find(x => x.id === c.id)) allChildObjectives.push(c);
    });

    return {
      ...obj,
      keyResults: krsWithHistory,
      childObjectives: allChildObjectives,
    };
  }

  static async getObjectivesByEmployee(employeeId: string) {
    const results = await db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      level: objectives.level,
      period: objectives.period,
      status: objectives.status,
      progress: objectives.progress,
      parentObjectiveId: objectives.parentObjectiveId,
      departmentId: objectives.departmentId,
      departmentName: departments.name,
      createdAt: objectives.createdAt,
    })
    .from(objectives)
    .leftJoin(departments, eq(objectives.departmentId, departments.id))
    .where(eq(objectives.ownerId, employeeId));

    // Enrich with KRs
    const enriched = await Promise.all(results.map(async (obj) => {
      const krs = await db.select().from(keyResults)
        .where(eq(keyResults.objectiveId, obj.id));

      // Get parent objective info if aligned
      let parentObjective = null;
      if (obj.parentObjectiveId) {
        const [parent] = await db.select({
          id: objectives.id,
          title: objectives.title,
          level: objectives.level,
        }).from(objectives).where(eq(objectives.id, obj.parentObjectiveId));
        parentObjective = parent || null;
      }

      return { ...obj, keyResults: krs, parentObjective };
    }));

    return enriched;
  }

  static async getObjectivesByDepartment(departmentId: string) {
    const results = await db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      level: objectives.level,
      period: objectives.period,
      status: objectives.status,
      progress: objectives.progress,
      parentObjectiveId: objectives.parentObjectiveId,
      ownerId: objectives.ownerId,
      ownerName: employees.name,
      createdAt: objectives.createdAt,
    })
    .from(objectives)
    .leftJoin(employees, eq(objectives.ownerId, employees.id))
    .where(eq(objectives.departmentId, departmentId));

    // Enrich with KRs
    const enriched = await Promise.all(results.map(async (obj) => {
      const krs = await db.select().from(keyResults)
        .where(eq(keyResults.objectiveId, obj.id));
      return { ...obj, keyResults: krs };
    }));

    return enriched;
  }

  static async createObjective(data: typeof objectives.$inferInsert) {
    const [result] = await db.insert(objectives).values(data).returning();

    // If there's a parentObjectiveId, also create an alignment record
    if (data.parentObjectiveId) {
      await db.insert(okrAlignments).values({
        childObjectiveId: result.id,
        parentObjectiveId: data.parentObjectiveId,
      });
    }

    return result;
  }

  static async updateObjective(id: string, data: Partial<typeof objectives.$inferInsert>) {
    const [result] = await db.update(objectives)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(objectives.id, id))
      .returning();

    // Update alignment if parentObjectiveId changed
    if (data.parentObjectiveId !== undefined) {
      await db.delete(okrAlignments).where(eq(okrAlignments.childObjectiveId, id));
      if (data.parentObjectiveId) {
        await db.insert(okrAlignments).values({
          childObjectiveId: id,
          parentObjectiveId: data.parentObjectiveId,
        });
      }
    }

    return result;
  }

  static async deleteObjective(id: string) {
    // Delete check-ins for KRs of this objective
    const krs = await db.select({ id: keyResults.id }).from(keyResults)
      .where(eq(keyResults.objectiveId, id));
    const krIds = krs.map(kr => kr.id);
    if (krIds.length > 0) {
      await db.delete(okrCheckIns).where(inArray(okrCheckIns.keyResultId, krIds));
    }
    // Delete KRs
    await db.delete(keyResults).where(eq(keyResults.objectiveId, id));
    // Delete alignments
    await db.delete(okrAlignments).where(eq(okrAlignments.childObjectiveId, id));
    await db.delete(okrAlignments).where(eq(okrAlignments.parentObjectiveId, id));
    // Unlink children
    await db.update(objectives)
      .set({ parentObjectiveId: null })
      .where(eq(objectives.parentObjectiveId, id));
    // Delete objective
    const [result] = await db.delete(objectives).where(eq(objectives.id, id)).returning();
    return result;
  }

  // ──────────────── KEY RESULTS ────────────────

  static async createKeyResult(objectiveId: string, data: Omit<typeof keyResults.$inferInsert, 'objectiveId'>) {
    const [result] = await db.insert(keyResults)
      .values({ ...data, objectiveId })
      .returning();

    return result;
  }

  static async updateKeyResult(id: string, data: Partial<typeof keyResults.$inferInsert>) {
    const [result] = await db.update(keyResults)
      .set(data)
      .where(eq(keyResults.id, id))
      .returning();

    // Recalculate parent objective progress
    if (result) {
      await this.recalculateProgress(result.objectiveId);
    }

    return result;
  }

  static async deleteKeyResult(id: string) {
    // Get objectiveId before deleting
    const [kr] = await db.select({ objectiveId: keyResults.objectiveId })
      .from(keyResults).where(eq(keyResults.id, id));

    await db.delete(okrCheckIns).where(eq(okrCheckIns.keyResultId, id));
    const [result] = await db.delete(keyResults).where(eq(keyResults.id, id)).returning();

    // Recalculate parent objective progress
    if (kr) {
      await this.recalculateProgress(kr.objectiveId);
    }

    return result;
  }

  // ──────────────── CHECK-INS ────────────────

  static async createCheckIn(keyResultId: string, data: { value: string; comment?: string; confidence?: string; createdBy?: string }) {
    // Insert check-in record
    const [checkIn] = await db.insert(okrCheckIns)
      .values({
        keyResultId,
        value: data.value,
        comment: data.comment,
        confidence: data.confidence || 'On Track',
        createdBy: data.createdBy,
      })
      .returning();

    // Update current value and confidence on the Key Result
    const [updatedKR] = await db.update(keyResults)
      .set({
        currentValue: data.value,
        confidence: data.confidence || 'On Track',
      })
      .where(eq(keyResults.id, keyResultId))
      .returning();

    // Recalculate objective progress
    if (updatedKR) {
      await this.recalculateProgress(updatedKR.objectiveId);
    }

    return checkIn;
  }

  static async getCheckInHistory(keyResultId: string) {
    return await db.select({
      id: okrCheckIns.id,
      value: okrCheckIns.value,
      comment: okrCheckIns.comment,
      confidence: okrCheckIns.confidence,
      createdBy: okrCheckIns.createdBy,
      createdByName: employees.name,
      createdAt: okrCheckIns.createdAt,
    })
    .from(okrCheckIns)
    .leftJoin(employees, eq(okrCheckIns.createdBy, employees.id))
    .where(eq(okrCheckIns.keyResultId, keyResultId))
    .orderBy(desc(okrCheckIns.createdAt));
  }

  // ──────────────── PROGRESS CALCULATION ────────────────

  static async recalculateProgress(objectiveId: string) {
    const krs = await db.select().from(keyResults)
      .where(eq(keyResults.objectiveId, objectiveId));

    if (krs.length === 0) {
      await db.update(objectives)
        .set({ progress: '0', updatedAt: new Date() })
        .where(eq(objectives.id, objectiveId));
      return;
    }

    // Weighted average: progress = sum(weight_i * progress_i) / sum(weight_i)
    let totalWeightedProgress = 0;
    let totalWeight = 0;

    krs.forEach(kr => {
      const initial = parseFloat(kr.initialValue || '0');
      const target = parseFloat(kr.targetValue || '1');
      const current = parseFloat(kr.currentValue || '0');
      const weight = parseFloat(kr.weight || '1');

      const range = target - initial;
      const krProgress = range !== 0 ? Math.min(Math.max((current - initial) / range, 0), 1) : 0;

      totalWeightedProgress += weight * krProgress;
      totalWeight += weight;
    });

    const overallProgress = totalWeight > 0 ? (totalWeightedProgress / totalWeight) : 0;

    await db.update(objectives)
      .set({ progress: overallProgress.toFixed(3), updatedAt: new Date() })
      .where(eq(objectives.id, objectiveId));
  }
}
