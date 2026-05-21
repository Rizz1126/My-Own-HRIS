import { Router } from 'express';
import { EssService } from './ess.service';

const router = Router();

router.get('/reimbursements', async (req, res) => {
  try {
    const { employeeId } = req.query;
    const data = await EssService.getReimbursements(employeeId as string);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reimbursements' });
  }
});

router.post('/reimbursements', async (req, res) => {
  try {
    const data = await EssService.createReimbursement(req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/profile/:id', async (req, res) => {
  try {
    const data = await EssService.updateProfile(req.params.id, req.body);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/announcements', async (req, res) => {
  try {
    const data = await EssService.getAnnouncements();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const data = await EssService.createAnnouncement(req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/announcements/:id', async (req, res) => {
  try {
    const data = await EssService.updateAnnouncement(req.params.id, req.body);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await EssService.deleteAnnouncement(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});
router.get('/notifications', async (req, res) => {
  try {
    const data = await EssService.getAdminNotifications();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

export default router;

