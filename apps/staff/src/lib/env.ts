import { z } from 'zod';

const EnvSchema = z.object({
	VITE_API_ORIGIN: z.url(),
	VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
	VITE_SENTRY_DSN: z.url().optional(),
	VITE_DEV_TENANT: z.string().optional(),
});

const parsed = EnvSchema.safeParse(import.meta.env);

if (!parsed.success) {
	const issues = parsed.error.issues
		.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
		.join('\n');
	throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
