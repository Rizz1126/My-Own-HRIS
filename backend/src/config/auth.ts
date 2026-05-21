import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from '../db/schema';

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
    // Add additional fields you want to collect on signup
    // e.g., requireEmailVerification: false
  },
});
