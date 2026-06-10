import { Router } from 'express';
import { MasterDataService } from './master-data.service.js';

const router = Router();

// ── Contracts ─────────────────────────────────────────────────────────────
router.get('/contracts', async (req, res) => {
  try {
    const contracts = await MasterDataService.getAllContracts();
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

router.post('/contracts', async (req, res) => {
  try {
    const contract = await MasterDataService.createContract(req.body);
    res.status(201).json(contract);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/contracts/:id', async (req, res) => {
  try {
    const updated = await MasterDataService.updateContract(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Contract not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/contracts/:id', async (req, res) => {
  try {
    const deleted = await MasterDataService.deleteContract(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Contract not found' });
    res.json({ success: true, deleted });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ── Clients ───────────────────────────────────────────────────────────────
router.get('/clients', async (req, res) => {
  try {
    const clients = await MasterDataService.getAllClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.post('/clients', async (req, res) => {
  try {
    const { clientName, name, ...rest } = req.body;
    const client = await MasterDataService.createClient({ ...rest, name: clientName || name });
    res.status(201).json(client);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/clients/:id', async (req, res) => {
  try {
    const updated = await MasterDataService.updateClient(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

router.delete('/clients/:id', async (req, res) => {
  try {
    const deleted = await MasterDataService.deleteClient(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true, deleted });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ── Projects ──────────────────────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const projects = await MasterDataService.getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const { projectName, projectStatus, projectCode, picAM, picPM, ...rest } = req.body;
    const project = await MasterDataService.createProject({
      ...rest,
      name: projectName || rest.name,
      status: projectStatus || rest.status || 'Active',
    });
    res.status(201).json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/projects/:id', async (req, res) => {
  try {
    const updated = await MasterDataService.updateProject(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const deleted = await MasterDataService.deleteProject(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, deleted });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ── Assignments ───────────────────────────────────────────────────────────
router.get('/assignments', async (req, res) => {
  try {
    const data = await MasterDataService.getAllAssignments();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

router.post('/assignments', async (req, res) => {
  try {
    const data = await MasterDataService.createAssignment(req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/assignments/:id', async (req, res) => {
  try {
    const updated = await MasterDataService.updateAssignment(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Assignment not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/assignments/:id', async (req, res) => {
  try {
    const deleted = await MasterDataService.deleteAssignment(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ success: true, deleted });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ── Departments ───────────────────────────────────────────────────────────
router.get('/departments', async (req, res) => {
  try {
    const data = await MasterDataService.getAllDepartments();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

export default router;
