import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

// Set to true to bypass Clerk auth validation in development
const BYPASS_AUTH = process.env.NODE_ENV === 'development';

export const Env = createEnv({
  server: {
    CLERK_SECRET_KEY: BYPASS_AUTH ? z.string().optional() : z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: BYPASS_AUTH ? z.string().optional() : z.string().min(1),
    NEXT_PUBLIC_API_URL: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
});
