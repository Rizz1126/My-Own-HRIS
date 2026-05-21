import { Router } from 'express';
import { OvertimeService } from './overtime.service';

const router = Router();

// Requests
router.get('/requests', async (req, res) => {
  try {
    const requests = await OvertimeService.getAllRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overtime requests' });
  }
});

router.get('/requests/employee/:employeeId', async (req, res) => {
  try {
    const requests = await OvertimeService.getRequestsByEmployee(req.params.employeeId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overtime requests' });
  }
});

router.post('/requests', async (req, res) => {
  try {
    const request = await OvertimeService.createRequest(req.body);
    res.status(201).json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/requests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    
    const updated = await OvertimeService.updateRequestStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// AI Analysis
router.post('/analyze', async (req, res) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) return res.status(400).json({ error: 'File URL is required' });
    
    const analysis = await OvertimeService.analyzeEvidence(fileUrl);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Batches
router.get('/batches', async (req, res) => {
  try {
    const batches = await OvertimeService.getAllBatches();
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

router.post('/batches', async (req, res) => {
  try {
    const batch = await OvertimeService.createBatch(req.body);
    res.status(201).json(batch);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
