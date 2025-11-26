import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  API_BASE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  API_BASE_URL: process.env.API_BASE_URL,
});

if (!parsed.success) {
  console.warn('Failed to validate environment variables', parsed.error.flatten().fieldErrors);
}

const baseUrl = parsed.success
  ? parsed.data.API_BASE_URL ?? parsed.data.NEXT_PUBLIC_API_BASE_URL
  : process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

export const API_BASE_URL = baseUrl ?? 'http://localhost:4000/api';
