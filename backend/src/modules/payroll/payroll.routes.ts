import { Router } from 'express';
import { PayrollService } from './payroll.service.js';

const router = Router();

router.get('/payslips', async (req, res) => {
  try {
    const payslips = await PayrollService.getAllPayslips();
    res.json(payslips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

router.get('/payslips/employee/:employeeId', async (req, res) => {
  try {
    const payslips = await PayrollService.getPayslipsByEmployee(req.params.employeeId);
    res.json(payslips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

router.post('/payslips', async (req, res) => {
  try {
    const payslip = await PayrollService.generatePayslip(req.body);
    res.status(201).json(payslip);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/payslips/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    const updated = await PayrollService.updatePayslipStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Payslip not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
