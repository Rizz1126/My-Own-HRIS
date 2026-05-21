import { db } from './src/config/db';
import { readFileSync } from 'fs';

async function applyMigration() {
  try {
    const sql = readFileSync('./drizzle/0001_noisy_magneto.sql', 'utf8');
    const statements = sql.split('--> statement-breakpoint').filter(s => s.trim());

    console.log(`Applying ${statements.length} migration statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      try {
        await db.execute(stmt);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (e) {
        console.error(`✗ Statement ${i + 1} failed:`, e.message);
      }
    }
    
    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration error:', err);
  }
}

applyMigration();
