import { eq, and, sql, or } from 'drizzle-orm';
import { db } from '../../config/db';
import { jobOpenings, candidates, departments, onboardingTasks, employees, assessments, assessmentScores, careerTracks, careerLevels, employeeCareerProgress } from '../../db/schema';

const DEFAULT_ONBOARDING_TASKS = [
  'Complete HR paperwork & employment contract signing',
  'Setup company email and system access',
  'IT equipment setup and software installation',
  'Introduction to team and department head',
  'Review company policies and code of conduct',
  'Complete mandatory compliance training',
  'Setup payroll and bank account details',
  'First 30-day performance check-in scheduled',
];

export class TalentService {
  // Job Openings
  static async getAllJobs() {
    return await db.select({
      id: jobOpenings.id,
      title: jobOpenings.title,
      type: jobOpenings.type,
      location: jobOpenings.location,
      status: jobOpenings.status,
      picId: jobOpenings.picId,
      createdAt: jobOpenings.createdAt,
      department: {
        id: departments.id,
        name: departments.name
      }
    })
    .from(jobOpenings)
    .leftJoin(departments, eq(jobOpenings.departmentId, departments.id));
  }

  static async createJob(data: typeof jobOpenings.$inferInsert) {
    const result = await db.insert(jobOpenings).values(data).returning();
    return result[0];
  }

  // Candidates
  static async getAllCandidates() {
    return await db.select().from(candidates);
  }

  static async getCandidatesByJob(jobId: string) {
    return await db.select()
      .from(candidates)
      .where(eq(candidates.jobId, jobId));
  }

  static async addCandidate(data: typeof candidates.$inferInsert) {
    const result = await db.insert(candidates).values(data).returning();
    return result[0];
  }

  static async updateCandidateStage(id: string, stage: string) {
    const result = await db.update(candidates)
      .set({ stage })
      .where(eq(candidates.id, id))
      .returning();
    return result[0];
  }

  static async updateCandidateApproval(id: string, role: 'hr' | 'manager', approved: boolean) {
    const updateData: Partial<typeof candidates.$inferInsert> = {};
    if (role === 'hr') updateData.hrApproval = approved;
    if (role === 'manager') updateData.managerApproval = approved;
    const result = await db.update(candidates)
      .set(updateData)
      .where(eq(candidates.id, id))
      .returning();
    return result[0];
  }

  // Hire candidate: move to Hired + find/create employee + auto-create onboarding tasks
  static async hireCandidate(candidateId: string, employeeId: string) {
    // 1. Move candidate to Hired
    const [updatedCandidate] = await db.update(candidates)
      .set({ stage: 'Hired' })
      .where(eq(candidates.id, candidateId))
      .returning();

    // 2. Create default onboarding tasks for the employee
    if (DEFAULT_ONBOARDING_TASKS.length > 0) {
      const taskInserts = DEFAULT_ONBOARDING_TASKS.map(title => ({
        employeeId,
        candidateId,
        title,
        isCompleted: false,
      }));
      await db.insert(onboardingTasks).values(taskInserts);
    }

    return { success: true, candidate: updatedCandidate };
  }

  // Onboarding
  static async getOnboardingProgress() {
    const tasks = await db.select({
      id: onboardingTasks.id,
      title: onboardingTasks.title,
      isCompleted: onboardingTasks.isCompleted,
      candidateId: onboardingTasks.candidateId,
      employeeId: employees.id,
      employeeName: employees.name,
      position: employees.position,
      startDate: employees.joinDate,
    })
    .from(onboardingTasks)
    .leftJoin(employees, eq(onboardingTasks.employeeId, employees.id));

    // Group by employee
    const employeeMap = new Map();
    tasks.forEach(t => {
      if (!employeeMap.has(t.employeeId)) {
        employeeMap.set(t.employeeId, {
          id: t.employeeId,
          employeeName: t.employeeName,
          position: t.position,
          startDate: t.startDate,
          tasks: []
        });
      }
      employeeMap.get(t.employeeId).tasks.push({
        id: t.id,
        title: t.title,
        completed: t.isCompleted
      });
    });

    return Array.from(employeeMap.values());
  }

  static async updateOnboardingTask(id: string, isCompleted: boolean) {
    const result = await db.update(onboardingTasks)
      .set({ isCompleted })
      .where(eq(onboardingTasks.id, id))
      .returning();
    return result[0];
  }

  static async createOnboardingTask(employeeId: string, title: string) {
    const result = await db.insert(onboardingTasks)
      .values({ employeeId, title, isCompleted: false })
      .returning();
    return result[0];
  }

  static async deleteOnboardingTask(id: string) {
    const result = await db.delete(onboardingTasks)
      .where(eq(onboardingTasks.id, id))
      .returning();
    return result[0];
  }

  // Assessments
  static async getAssessments() {
    return await db.select({
      id: assessments.id,
      employeeId: employees.id,
      employeeName: employees.name,
      position: employees.position,
      department: departments.name,
      period: assessments.period,
      status: assessments.status,
      overallScore: assessments.overallScore,
      managerId: assessments.managerId,
      peerId: assessments.peerId,
      instrument: assessments.instrument
    })
    .from(assessments)
    .leftJoin(employees, eq(assessments.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id));
  }

  static async getAssessmentsByEvaluator(employeeId: string) {
    if (!employeeId || employeeId === 'undefined') return [];
    
    // Return assessments where the employee is the subject, manager, or peer
    const results = await db.select({
      id: assessments.id,
      subjectId: assessments.employeeId,
      employeeName: employees.name,
      position: employees.position,
      department: departments.name,
      period: assessments.period,
      status: assessments.status,
      overallScore: assessments.overallScore,
      managerId: assessments.managerId,
      peerId: assessments.peerId,
      instrument: assessments.instrument
    })
    .from(assessments)
    .leftJoin(employees, eq(assessments.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(
      or(
        eq(assessments.employeeId, employeeId),
        eq(assessments.managerId, employeeId),
        eq(assessments.peerId, employeeId)
      )
    );

    return results.map(r => ({
      ...r,
      employeeId: r.subjectId
    }));
  }

  static async getAssessmentDetail(id: string) {
    const scores = await db.select()
      .from(assessmentScores)
      .where(eq(assessmentScores.assessmentId, id));
    return scores;
  }

  static async createAssessment(employeeId: string, period: string, competencies: string[], managerId?: string, peerId?: string, instrument?: string) {
    // Create the assessment record
    const [assessment] = await db.insert(assessments)
      .values({ employeeId, period, status: 'Pending', overallScore: '0', managerId, peerId, instrument })
      .returning();

    // Insert empty score rows for each competency
    if (competencies.length > 0) {
      await db.insert(assessmentScores).values(
        competencies.map(competency => ({
          assessmentId: assessment.id,
          competency,
          selfScore: '0',
          managerScore: '0',
          peerScore: '0',
        }))
      );
    }
    return assessment;
  }

  static async submitAssessmentScore(assessmentId: string, competency: string, role: 'self' | 'manager' | 'peer', score: number) {
    // Find or create the score row
    const existing = await db.select()
      .from(assessmentScores)
      .where(and(eq(assessmentScores.assessmentId, assessmentId), eq(assessmentScores.competency, competency)));

    if (existing.length > 0) {
      const updateData: Partial<typeof assessmentScores.$inferInsert> = {};
      if (role === 'self') updateData.selfScore = score.toString();
      if (role === 'manager') updateData.managerScore = score.toString();
      if (role === 'peer') updateData.peerScore = score.toString();
      await db.update(assessmentScores)
        .set(updateData)
        .where(eq(assessmentScores.id, existing[0].id));
    } else {
      await db.insert(assessmentScores).values({
        assessmentId,
        competency,
        selfScore: role === 'self' ? score.toString() : '0',
        managerScore: role === 'manager' ? score.toString() : '0',
        peerScore: role === 'peer' ? score.toString() : '0',
      });
    }
    return { success: true };
  }

  static async completeAssessment(id: string) {
    // Calculate overall score from all competency averages
    const scores = await db.select().from(assessmentScores).where(eq(assessmentScores.assessmentId, id));
    let totalAvg = 0;
    scores.forEach(s => {
      const avg = (parseFloat(s.selfScore || '0') + parseFloat(s.managerScore || '0') + parseFloat(s.peerScore || '0')) / 3;
      totalAvg += avg;
    });
    const overallScore = scores.length > 0 ? (totalAvg / scores.length).toFixed(2) : '0';

    const result = await db.update(assessments)
      .set({ status: 'Completed', overallScore, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();
    return result[0];
  }

  static async deleteAssessment(id: string) {
    await db.delete(assessmentScores).where(eq(assessmentScores.assessmentId, id));
    const result = await db.delete(assessments).where(eq(assessments.id, id)).returning();
    return result[0];
  }

  // Career Paths
  static async getCareerTracks() {
    const tracks = await db.select().from(careerTracks);
    const levels = await db.select().from(careerLevels);
    
    return tracks.map(t => ({
      ...t,
      levels: levels.filter(l => l.trackId === t.id).sort((a, b) => a.level - b.level)
    }));
  }

  static async getEmployeeCareerProgress() {
    return await db.select({
      id: employeeCareerProgress.id,
      employeeId: employees.id,
      employeeName: employees.name,
      position: employees.position,
      trackId: employeeCareerProgress.trackId,
      currentLevel: employeeCareerProgress.currentLevel,
      readiness: employeeCareerProgress.readiness,
      yearsInRole: employeeCareerProgress.yearsInRole,
    })
    .from(employeeCareerProgress)
    .leftJoin(employees, eq(employeeCareerProgress.employeeId, employees.id));
  }

  static async assignEmployeeToTrack(employeeId: string, trackId: string, currentLevel: number, yearsInRole: number, readiness: number) {
    // Check if already assigned to this track
    const existing = await db.select().from(employeeCareerProgress)
      .where(and(eq(employeeCareerProgress.employeeId, employeeId), eq(employeeCareerProgress.trackId, trackId)));
    
    if (existing.length > 0) {
      // Update existing
      const result = await db.update(employeeCareerProgress)
        .set({ currentLevel, yearsInRole: yearsInRole.toString(), readiness })
        .where(eq(employeeCareerProgress.id, existing[0].id))
        .returning();
      return result[0];
    }

    const result = await db.insert(employeeCareerProgress)
      .values({ employeeId, trackId, currentLevel, yearsInRole: yearsInRole.toString(), readiness })
      .returning();
    return result[0];
  }

  static async updateCareerProgress(id: string, readiness: number, currentLevel: number, yearsInRole: number) {
    const result = await db.update(employeeCareerProgress)
      .set({ readiness, currentLevel, yearsInRole: yearsInRole.toString() })
      .where(eq(employeeCareerProgress.id, id))
      .returning();
    return result[0];
  }

  static async deleteCareerAssignment(id: string) {
    const result = await db.delete(employeeCareerProgress)
      .where(eq(employeeCareerProgress.id, id))
      .returning();
    return result[0];
  }

  static async createCareerTrack(name: string) {
    const result = await db.insert(careerTracks)
      .values({ name })
      .returning();
    return result[0];
  }

  static async deleteCareerTrack(id: string) {
    await db.delete(careerLevels).where(eq(careerLevels.trackId, id));
    await db.delete(employeeCareerProgress).where(eq(employeeCareerProgress.trackId, id));
    const result = await db.delete(careerTracks)
      .where(eq(careerTracks.id, id))
      .returning();
    return result[0];
  }

  static async createCareerLevel(trackId: string, level: number, title: string, minYears: number, salaryRange: string, requirements: string) {
    const result = await db.insert(careerLevels)
      .values({ trackId, level, title, minYears, salaryRange, requirements })
      .returning();
    return result[0];
  }

  static async deleteCareerLevel(id: string) {
    const result = await db.delete(careerLevels)
      .where(eq(careerLevels.id, id))
      .returning();
    return result[0];
  }
}
