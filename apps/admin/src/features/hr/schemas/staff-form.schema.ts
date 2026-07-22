import { z } from 'zod';

import { UZ_PHONE_REGEX } from '@repo/utils';

const phone = z
	.string()
	.min(1, 'Phone is required')
	.regex(UZ_PHONE_REGEX, 'Enter a valid phone number');

const email = z.union([z.literal(''), z.email('Enter a valid email')]).optional();

/**
 * The initial login password, set only when registering a staff member. Blank is
 * allowed (the member sets their own later, from their account page), but anything
 * typed must clear the backend's 8–128 policy. Same blank-or-valid shape as `email`.
 *
 * Changing it afterwards is not part of the edit form — it is a separate,
 * confirm-guarded action (see {@link changeStaffPasswordSchema}) so a credential is
 * never rewritten as a side effect of saving unrelated profile fields.
 */
const optionalPassword = z
	.union([
		z.literal(''),
		z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.max(128, 'Password must be at most 128 characters'),
	])
	.optional();

// The pay model (fixed/percent, salary, share) is no longer part of the staff
// forms — it lives on the dated payroll-config timeline (see
// `payroll-config-form.schema.ts` and the staff detail Payroll tab).

export const createStaffSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	roleName: z.enum(['TEACHER', 'MANAGER', 'ADMIN'], { error: 'Role is required' }),
	branchId: z.number({ error: 'Branch is required' }).min(1, 'Branch is required'),
	position: z.string().optional(),
	phone,
	email,
	employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR']),
	hireDate: z.string().optional(),
	specialization: z.string().optional(),
	password: optionalPassword,
});

export const editStaffSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	phone,
	email,
	position: z.string().optional(),
	employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR']),
	specialization: z.string().optional(),
	status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']),
});

/**
 * Operator reset of a staff member's password (`PATCH /staff/:id` with only
 * `password`). `confirmPassword` is a client-side guard only — the server takes
 * just `password` — and matters more here than on `/account`, since the operator
 * cannot verify the result by signing in. Length mirrors the backend's 8–128 policy.
 */
export const changeStaffPasswordSchema = z
	.object({
		newPassword: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.max(128, 'Password must be at most 128 characters'),
		confirmPassword: z.string().min(1, 'Please confirm the new password'),
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

export type CreateStaffFormValues = z.infer<typeof createStaffSchema>;
export type EditStaffFormValues = z.infer<typeof editStaffSchema>;
export type ChangeStaffPasswordFormValues = z.infer<typeof changeStaffPasswordSchema>;

/** Split "Physics, Chemistry" → ['Physics', 'Chemistry'] (empty → []). */
export function parseSpecialization(input?: string): string[] {
	if (!input) return [];
	return input
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}
