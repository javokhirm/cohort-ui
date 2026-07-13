import { z } from 'zod';

/**
 * Change-my-password form. `confirmPassword` is a client-side guard only — the
 * server takes just `newPassword` (`PATCH /manage/me/password`). Length mirrors
 * the backend's 8–128 policy so the user sees the error before a round-trip.
 */
export const changePasswordSchema = z
	.object({
		newPassword: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.max(128, 'Password must be at most 128 characters'),
		confirmPassword: z.string().min(1, 'Please confirm your new password'),
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
