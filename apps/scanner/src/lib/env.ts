import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

const parsed = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  console.error(
    '[flintmere] Invalid environment:',
    parsed.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
