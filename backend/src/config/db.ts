import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

const envPath = new URL('../../.env', import.meta.url);
dotenv.config({ path: envPath.pathname });

// for query purposes
const queryClient = postgres(process.env.DATABASE_URL as string);
export const db = drizzle(queryClient, { schema });
