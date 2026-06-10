import { Router } from 'express';
import { eq, or, sql } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { users, employees, departments } from '../../db/schema.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // In a real app, we would hash the password. For this demo, we'll use plain text as requested by the current mock.
    // Or we could just bypass password check for now if it's a demo.
    
    const user = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      employeeId: employees.id,
      position: employees.position,
      department: departments.name,
      departmentId: departments.id,
      avatarColor: sql<string>`'#6366F1'` // Default avatar color
    })
    .from(users)
    .leftJoin(employees, eq(users.id, employees.userId))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(or(eq(employees.id, identifier), eq(users.email, identifier)))
    .limit(1);

    console.log('Login attempt:', identifier, 'Found:', user.length > 0);

    if (user.length === 0) {
      return res.status(401).json({ error: 'Employee ID or email not found' });
    }

    const validPasswords = ['admin123', 'hr123', 'demo123', 'password123'];
    if (!validPasswords.includes(password)) {
      return res.status(401).json({ error: 'Invalid password for demo' });
    }

    res.json({
      success: true,
      user: user[0]
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
