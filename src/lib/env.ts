import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().url().optional(), MONGODB_DB: z.string().min(1).default("studentos"),
  GROQ_API_KEY: z.string().optional(), NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().optional(), AUTH_GOOGLE_ID: z.string().optional(), AUTH_GOOGLE_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().default(""), CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(), CLOUDINARY_API_SECRET: z.string().optional(),
});
export function getEnv() {
  const result = schema.safeParse({
    ...process.env,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  });
  if (!result.success) throw new Error(`Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  return result.data;
}
