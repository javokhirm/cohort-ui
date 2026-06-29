import { z } from 'zod';

/**
 * Typed, validated environment. Only `VITE_`-prefixed vars are exposed to the
 * bundle (docs/environments.md). Admin is platform-wide — there is no tenant
 * subdomain, so no `VITE_DEV_TENANT`. Read config through `env`, never
 * `import.meta.env` directly.
 */
const EnvSchema = z.object({
	VITE_API_ORIGIN: z.url(),
	VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
});

const parsed = EnvSchema.safeParse(import.meta.env);

if (!parsed.success) {
	const issues = parsed.error.issues
		.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
		.join('\n');
	throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
