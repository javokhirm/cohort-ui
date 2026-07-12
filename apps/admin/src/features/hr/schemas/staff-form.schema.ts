import { z } from 'zod';

const phone = z
	.string()
	.min(1, 'Phone is required')
	.regex(/^\+[1-9]\d{6,14}$/, 'Enter a valid phone number');

const email = z.union([z.literal(''), z.email('Enter a valid email')]).optional();

/**
 * The initial login password, set only when registering a staff member. Blank is
 * allowed (the member sets their own later, from their account page), but anything
 * typed must clear the backend's 8–128 policy. Same blank-or-valid shape as `email`.
 *
 * There is deliberately no password field on the edit form: a password is only ever
 * set at creation or changed by its owner on `/account`.
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
	baseSalary: z.number().min(0, 'Salary cannot be negative').optional(),
	specialization: z.string().optional(),
	password: optionalPassword,
});

export const editStaffSchema = z.object({
	position: z.string().optional(),
	employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR']),
	baseSalary: z.number().min(0, 'Salary cannot be negative').optional(),
	specialization: z.string().optional(),
	status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']),
});

export type CreateStaffFormValues = z.infer<typeof createStaffSchema>;
export type EditStaffFormValues = z.infer<typeof editStaffSchema>;

/** Split "Physics, Chemistry" → ['Physics', 'Chemistry'] (empty → []). */
export function parseSpecialization(input?: string): string[] {
	if (!input) return [];
	return input
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}
