import { z } from 'zod';

const phone = z
	.string()
	.min(1, 'Phone is required')
	.regex(/^\+[1-9]\d{6,14}$/, 'Enter a valid phone number');

const email = z.union([z.literal(''), z.email('Enter a valid email')]).optional();

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
