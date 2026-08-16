import { z } from 'zod';

const environmentSchema = z.object({
  GITHUB_TOKEN: z.string().min(1, 'GITHUB_TOKEN is required'),
  MODEL_API_KEY: z.string().min(1, 'MODEL_API_KEY is required'),
  MODEL_NAME: z.string().min(1).default('gpt-4.1-mini'),
  MODEL_PROVIDER: z.string().min(1).default('openai'),
});

export type AppEnvironment = z.infer<typeof environmentSchema>;

export function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env
): AppEnvironment {
  return environmentSchema.parse(source);
}
