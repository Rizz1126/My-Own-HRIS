import { db } from './src/config/db';
import { departments } from './src/db/schema';

async function test() {
  try {
    const result = await db.insert(departments).values([
      { name: 'Engineering', colorCode: '#6366F1' },
      { name: 'HR', colorCode: '#EC4899' }
    ]).returning();
    console.log('Insert OK:', result);
  } catch (e) {
    console.error('Insert failed:', e);
  }
}

test();