import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

// In Vercel, environment variables are available directly
// In local development, dotenv loads them
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  const { fileURLToPath } = await import('url');
  const { dirname, resolve } = await import('path');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: resolve(__dirname, '../../.env') });
}

// for query purposes
const queryClient = postgres(process.env.DATABASE_URL as string);
export const db = drizzle(queryClient, { schema });
