import { z } from 'zod';

export const resetPasswordSchema = z.object({
	newPassword: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(128, 'Password must be at most 128 characters'),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
