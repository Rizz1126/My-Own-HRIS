import { db } from './src/config/db';
import { readFileSync } from 'fs';

async function runMigration() {
  const sql = readFileSync('./drizzle/0000_mixed_crystal.sql', 'utf8');
  const statements = sql.split('--> statement-breakpoint');

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await db.execute(statement.trim());
        console.log('Executed statement');
      } catch (e) {
        console.error('Error executing statement:', e);
      }
    }
  }
}

runMigration();