import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema.js';

// In Vercel, environment variables are available directly
// In local development, dotenv loads them
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  const path = await import('path');
  dotenv.default.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
}

// Use POSTGRES_URL (Supabase) or DATABASE_URL as fallback
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Database connection string not found. Set POSTGRES_URL or DATABASE_URL.');
}

const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
