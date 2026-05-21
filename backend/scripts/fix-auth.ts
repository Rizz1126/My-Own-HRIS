import { db } from '../src/config/db';
import { users, employees, accounts } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔑 Creating admin users...');

  // Better Auth expects a specific structure. 
  // For simplicity in development seeder, we can insert directly.
  // Note: Better Auth uses hashing for passwords. 
  // However, for a quick recovery, we'll try to insert basic user records.
  
  const adminEmail = 'admin@perusahaan.id';
  const superAdminEmail = 'superadmin@perusahaan.id';

  // 1. Create Users
  const userResults = await db.insert(users).values([
    {
      id: 'user-superadmin',
      name: 'Ahmad Faisal',
      email: 'superadmin@perusahaan.id',
      role: 'Super Admin',
    },
    {
      id: 'user-admin',
      name: 'Siti Aminah',
      email: 'admin@perusahaan.id',
      role: 'Admin',
    },
    {
      id: 'user-employee',
      name: 'Budi Santoso',
      email: 'budi.santoso@perusahaan.id',
      role: 'Employee',
    }
  ]).onConflictDoUpdate({
    target: users.email,
    set: { role: sql`excluded.role`, name: sql`excluded.name` }
  }).returning();

  // 2. Link to Employees
  console.log('🔗 Linking employees to user accounts...');
  await db.update(employees)
    .set({ userId: 'user-superadmin' })
    .where(eq(employees.id, 'EMP-0001'));

  await db.update(employees)
    .set({ userId: 'user-admin' })
    .where(eq(employees.id, 'EMP-0002'));

  await db.update(employees)
    .set({ userId: 'user-employee' })
    .where(eq(employees.id, 'EMP-0003'));

  console.log('✅ Demo accounts are ready!');
  process.exit(0);
}

// Helper for sql in onConflict
import { sql } from 'drizzle-orm';

main().catch(console.error);
