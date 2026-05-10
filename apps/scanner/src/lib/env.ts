import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Cold-email outreach pipeline. From + ReplyTo default to the
  // team.flintmere.com sending subdomain so the apex hello@flintmere.com
  // transactional reputation stays clean. OUTREACH_SPRINT_START anchors
  // the daily-cap ramp; format ISO date YYYY-MM-DD.
  RESEND_OUTREACH_FROM: z
    .string()
    .default('Flintmere <hello@team.flintmere.com>'),
  RESEND_OUTREACH_REPLY_TO: z.string().default('hello@team.flintmere.com'),
  OUTREACH_SPRINT_START: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default('2026-05-11'),
});

const parsed = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
  RESEND_OUTREACH_FROM: process.env.RESEND_OUTREACH_FROM,
  RESEND_OUTREACH_REPLY_TO: process.env.RESEND_OUTREACH_REPLY_TO,
  OUTREACH_SPRINT_START: process.env.OUTREACH_SPRINT_START,
});

if (!parsed.success) {
  console.error(
    '[flintmere] Invalid environment:',
    parsed.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
