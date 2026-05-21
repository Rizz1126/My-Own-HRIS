import { db } from '../src/config/db';
import { users } from '../src/db/schema';

async function main() {
  const allUsers = await db.select().from(users);
  console.log(JSON.stringify(allUsers, null, 2));
  process.exit(0);
}

main().catch(console.error);
