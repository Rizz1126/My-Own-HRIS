import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

// In Vercel, environment variables are available directly
// In local development, dotenv loads them
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  const path = require('path');
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

// Use POSTGRES_URL (Supabase) or DATABASE_URL as fallback
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Database connection string not found. Set POSTGRES_URL or DATABASE_URL.');
}

const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
