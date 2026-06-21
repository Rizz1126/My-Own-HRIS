import { Router } from 'express';
import { TalentService } from './talent.service.js';
import { OKRService } from './okr.service.js';

const router = Router();


// Job Openings
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await TalentService.getAllJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.post('/jobs', async (req, res) => {
  try {
    const job = await TalentService.createJob(req.body);
    res.status(201).json(job);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Candidates
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await TalentService.getAllCandidates();
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all candidates' });
  }
});

router.get('/jobs/:jobId/candidates', async (req, res) => {
  try {
    const candidates = await TalentService.getCandidatesByJob(req.params.jobId);
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

router.post('/candidates', async (req, res) => {
  try {
    const candidate = await TalentService.addCandidate(req.body);
    res.status(201).json(candidate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/candidates/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ error: 'Stage is required' });
    const updated = await TalentService.updateCandidateStage(req.params.id, stage);
    if (!updated) return res.status(404).json({ error: 'Candidate not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/candidates/:id/approve', async (req, res) => {
  try {
    const { role, approved } = req.body;
    if (!role || !['hr', 'manager'].includes(role)) return res.status(400).json({ error: 'role must be hr or manager' });
    const updated = await TalentService.updateCandidateApproval(req.params.id, role, approved);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/candidates/:id/hire', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'employeeId is required to auto-create onboarding' });
    const result = await TalentService.hireCandidate(req.params.id, employeeId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Onboarding
router.get('/onboarding', async (req, res) => {
  try {
    const data = await TalentService.getOnboardingProgress();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch onboarding progress' });
  }
});

router.patch('/onboarding/:id', async (req, res) => {
  try {
    const { isCompleted } = req.body;
    const data = await TalentService.updateOnboardingTask(req.params.id, isCompleted);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/onboarding', async (req, res) => {
  try {
    const { employeeId, title } = req.body;
    if (!employeeId || !title) return res.status(400).json({ error: 'employeeId and title are required' });
    const data = await TalentService.createOnboardingTask(employeeId, title);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/onboarding/:id', async (req, res) => {
  try {
    const data = await TalentService.deleteOnboardingTask(req.params.id);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Public Onboarding Form Endpoints
router.get('/onboarding-form/:candidateId', async (req, res) => {
  try {
    const data = await TalentService.getCandidateForOnboarding(req.params.candidateId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Invalid or expired link' });
  }
});

router.post('/onboarding-form/:candidateId/submit', async (req, res) => {
  try {
    const result = await TalentService.processOnboardingSubmission(req.params.candidateId, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Submission failed' });
  }
});

// Assessments
router.get('/assessments', async (req, res) => {
  try {
    const data = await TalentService.getAssessments();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

router.get('/assessments/my/:employeeId', async (req, res) => {
  try {
    const data = await TalentService.getAssessmentsByEvaluator(req.params.employeeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch my assessments' });
  }
});

router.get('/assessments/:id', async (req, res) => {
  try {
    const data = await TalentService.getAssessmentDetail(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessment detail' });
  }
});

router.post('/assessments', async (req, res) => {
  try {
    const { employeeId, period, competencies, managerId, peerId, instrument } = req.body;
    if (!employeeId || !period) return res.status(400).json({ error: 'employeeId and period are required' });
    const data = await TalentService.createAssessment(employeeId, period, competencies || [], managerId, peerId, instrument);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/assessments/:id/scores', async (req, res) => {
  try {
    const { competency, role, score } = req.body;
    if (!competency || !role || score === undefined) return res.status(400).json({ error: 'competency, role and score are required' });
    const data = await TalentService.submitAssessmentScore(req.params.id, competency, role, parseFloat(score));
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/assessments/:id/complete', async (req, res) => {
  try {
    const data = await TalentService.completeAssessment(req.params.id);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/assessments/:id', async (req, res) => {
  try {
    const data = await TalentService.deleteAssessment(req.params.id);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Career Paths
router.get('/career-tracks', async (req, res) => {
  try {
    const data = await TalentService.getCareerTracks();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch career tracks' });
  }
});

router.get('/employee-career', async (req, res) => {
  try {
    const data = await TalentService.getEmployeeCareerProgress();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee career progress' });
  }
});

router.post('/employee-career', async (req, res) => {
  try {
    const { employeeId, trackId, currentLevel, yearsInRole, readiness } = req.body;
    if (!employeeId || !trackId) return res.status(400).json({ error: 'employeeId and trackId are required' });
    const data = await TalentService.assignEmployeeToTrack(employeeId, trackId, currentLevel || 1, yearsInRole || 0, readiness || 0);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/employee-career/:id', async (req, res) => {
  try {
    const { readiness, currentLevel, yearsInRole } = req.body;
    const data = await TalentService.updateCareerProgress(req.params.id, readiness, currentLevel, yearsInRole);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/employee-career/:id', async (req, res) => {
  try {
    const data = await TalentService.deleteCareerAssignment(req.params.id);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/career-tracks', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const data = await TalentService.createCareerTrack(name);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/career-tracks/:id', async (req, res) => {
  try {
    const data = await TalentService.deleteCareerTrack(req.params.id);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/career-tracks/:id/levels', async (req, res) => {
  try {
    const { level, title, minYears, salaryRange, requirements } = req.body;
    if (!level || !title) return res.status(400).json({ error: 'level and title are required' });
    const data = await TalentService.createCareerLevel(req.params.id, level, title, minYears, salaryRange, requirements);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/career-levels/:id', async (req, res) => {
  try {
    const data = await TalentService.deleteCareerLevel(req.params.id);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ──────────────── OKR ────────────────

// Objectives
router.get('/okr', async (req, res) => {
  try {
    const { period, level } = req.query as { period?: string; level?: string };
    const data = await OKRService.getAllObjectives(period, level);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch objectives' });
  }
});

router.get('/okr/tree', async (req, res) => {
  try {
    const { period } = req.query as { period?: string };
    if (!period) return res.status(400).json({ error: 'period query parameter is required' });
    const data = await OKRService.getObjectiveTree(period);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch objective tree' });
  }
});

router.get('/okr/employee/:employeeId', async (req, res) => {
  try {
    const data = await OKRService.getObjectivesByEmployee(req.params.employeeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee objectives' });
  }
});

router.get('/okr/department/:departmentId', async (req, res) => {
  try {
    const data = await OKRService.getObjectivesByDepartment(req.params.departmentId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department objectives' });
  }
});

router.get('/okr/:id', async (req, res) => {
  try {
    const data = await OKRService.getObjectiveById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Objective not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch objective detail' });
  }
});

router.post('/okr', async (req, res) => {
  try {
    const data = await OKRService.createObjective(req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/okr/:id', async (req, res) => {
  try {
    const data = await OKRService.updateObjective(req.params.id, req.body);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/okr/:id', async (req, res) => {
  try {
    const data = await OKRService.deleteObjective(req.params.id);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Key Results
router.post('/okr/:id/key-results', async (req, res) => {
  try {
    const data = await OKRService.createKeyResult(req.params.id, req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/okr/key-results/:id', async (req, res) => {
  try {
    const data = await OKRService.updateKeyResult(req.params.id, req.body);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/okr/key-results/:id', async (req, res) => {
  try {
    const data = await OKRService.deleteKeyResult(req.params.id);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Check-ins
router.post('/okr/key-results/:id/check-in', async (req, res) => {
  try {
    const data = await OKRService.createCheckIn(req.params.id, req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/okr/key-results/:id/history', async (req, res) => {
  try {
    const data = await OKRService.getCheckInHistory(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch check-in history' });
  }
});

export default router;

