import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("FreechargeIMS"),
  NEXT_PUBLIC_FORWARD_FRONTEND_LOGS: z.enum(["true", "false"]).default("false"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_FORWARD_FRONTEND_LOGS: process.env.NEXT_PUBLIC_FORWARD_FRONTEND_LOGS,
});

export const apiBaseUrl = env.NEXT_PUBLIC_API_BASE;