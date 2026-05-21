import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';

async function reset() {
  // Connect to postgres db
  const client = postgres('postgresql://postgres:postgres@localhost:5432/postgres');
  const db = drizzle(client);

  console.log('Dropping database...');
  await db.execute(sql`DROP DATABASE IF EXISTS hris_db`);
  await db.execute(sql`CREATE DATABASE hris_db`);
  console.log('Done');

  await client.end();

  // Connect to hris_db
  const client2 = postgres('postgresql://postgres:postgres@localhost:5432/hris_db');
  const db2 = drizzle(client2);

  console.log('Creating tables...');
  const sqlContent = readFileSync('./drizzle/0000_mixed_crystal.sql', 'utf8');
  const statements = sqlContent.split('--> statement-breakpoint').filter(s => s.trim());

  for (const statement of statements) {
    if (statement.trim()) {
      await db2.execute(statement.trim());
    }
  }
  console.log('Tables created');

  await client2.end();
}

reset().catch(console.error);