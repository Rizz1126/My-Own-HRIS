import { Router } from 'express';
import { EmployeeService } from './employees.service.js';
import { UserService } from './users.service.js';

const router = Router();

router.get('/users/all', async (req, res) => {
  try {
    const data = await UserService.getAllUsers();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const data = await UserService.updateRole(req.params.id, req.body.role);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});


router.get('/', async (req, res) => {
  try {
    const employees = await EmployeeService.getAllEmployees();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const employee = await EmployeeService.getEmployeeById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

router.post('/', async (req, res) => {
  try {
    const employee = await EmployeeService.createEmployee(req.body);
    res.status(201).json(employee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const employee = await EmployeeService.updateEmployee(req.params.id, req.body);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/department/:id', async (req, res) => {
  try {
    const data = await EmployeeService.getEmployeesByDepartment(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.get('/:id/assignments', async (req, res) => {
  try {
    const data = await EmployeeService.getAssignmentsByEmployee(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

export default router;
