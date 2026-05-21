import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import dotenv from 'dotenv';
dotenv.config();

const queryClient = postgres(process.env.DATABASE_URL as string);
const db = drizzle(queryClient, { schema });

async function test() {
  try {
    const emp = { id: 'EMP004', name: 'Dewi Lestari', email: 'dewi.lestari@perusahaan.id', nik: '3201014504950004', position: 'UI/UX Designer', departmentId: '1f5160de-acda-4b6e-8463-75beb4b9b9a9', level: 'Middle', joinDate: '2022-08-10', baseSalary: 15000000, status: 'Active' };
    const result = await db.insert(schema.employees).values(emp).returning();
    console.log(result);
  } catch (e) {
    console.error("ACTUAL ERROR:", e);
  } finally {
    process.exit(0);
  }
}
test();
