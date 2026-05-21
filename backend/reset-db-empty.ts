import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function reset() {
  const client = postgres('postgresql://postgres:postgres@localhost:5432/postgres');
  const db = drizzle(client);

  console.log('Terminating other connections...');
  try {
    await db.execute(sql`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'hris_db' AND pid <> pg_backend_pid();
    `);
  } catch(e) {}

  console.log('Dropping database...');
  await db.execute(sql`DROP DATABASE IF EXISTS hris_db`);
  await db.execute(sql`CREATE DATABASE hris_db`);
  console.log('Database hris_db created. Exiting.');

  await client.end();
}

reset().catch(console.error);
