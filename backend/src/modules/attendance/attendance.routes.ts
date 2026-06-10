import { Router } from 'express';
import { AttendanceService } from './attendance.service.js';

const router = Router();

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const records = await AttendanceService.getTodayAttendance(today);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

router.post('/check-in', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Employee ID required' });
    
    const record = await AttendanceService.checkIn(employeeId);
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/check-out', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Employee ID required' });
    
    const record = await AttendanceService.checkOut(employeeId);
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/shifts', async (req, res) => {
  try {
    const data = await AttendanceService.getShifts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

router.get('/schedules', async (req, res) => {
  try {
    const data = await AttendanceService.getSchedules();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

router.get('/leaves', async (req, res) => {
  try {
    const data = await AttendanceService.getLeaves();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

router.post('/leaves', async (req, res) => {
  try {
    const data = await AttendanceService.createLeave(req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/leaves/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const data = await AttendanceService.updateLeaveStatus(req.params.id, status);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/room/:departmentId', async (req, res) => {
  try {
    const data = await AttendanceService.getRoomMembers(req.params.departmentId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room members' });
  }
});

export default router;
