import { z } from 'zod';

/** Step 1 — operator credentials. */
export const credentialsSchema = z.object({
	email: z.email('Enter a valid email address.'),
	password: z.string().min(1, 'Password is required.'),
});
export type CredentialsInput = z.infer<typeof credentialsSchema>;

/** Step 2 — the 6-digit one-time code. */
export const otpSchema = z.object({
	code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.'),
});
export type OtpFormValues = z.infer<typeof otpSchema>;
