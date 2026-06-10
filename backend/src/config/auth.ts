import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db.js';
import * as schema from '../db/schema.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verification
    }
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: process.env.VERCEL_URL 
    ? [`https://${process.env.VERCEL_URL}`, process.env.FRONTEND_URL].filter(Boolean) as string[]
    : ['http://localhost:5173', 'http://localhost:3000'],
});
