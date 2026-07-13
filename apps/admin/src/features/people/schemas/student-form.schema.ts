import { z } from 'zod';

import { UZ_PHONE_REGEX } from '@repo/utils';

const phone = z
	.string()
	.min(1, 'Phone is required')
	.regex(UZ_PHONE_REGEX, 'Enter a valid phone number');

export const createStudentSchema = z.object({
	fullName: z
		.string()
		.min(2, 'Full name is required')
		.refine((v) => v.trim().includes(' '), {
			message: 'Please enter both first and last name',
		}),
	dateOfBirth: z.string().optional(),
	gender: z.enum(['M', 'F', 'O']).optional(),
	phone,
	branchId: z.number({ error: 'Branch is required' }).min(1, 'Branch is required'),
	address: z.string().optional(),

	guardianName: z
		.string()
		.min(2, 'Guardian name is required')
		.refine((v) => v.trim().includes(' '), {
			message: 'Please enter both first and last name',
		}),
	guardianPhone: phone,
	guardianRelation: z.enum(['mother', 'father', 'guardian']),

	// No fee plan: the student bills on the plan attached to the group's course.
	groupId: z.number().optional(),
});

export const editStudentSchema = z.object({
	fullName: z
		.string()
		.min(2, 'Full name is required')
		.refine((v) => v.trim().includes(' '), {
			message: 'Please enter both first and last name',
		}),
	dateOfBirth: z.string().optional(),
	gender: z.enum(['M', 'F', 'O']).optional(),
	phone,
	branchId: z.number({ error: 'Branch is required' }).min(1, 'Branch is required'),
	address: z.string().optional(),
	status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED']).optional(),
});

export type CreateStudentFormValues = z.infer<typeof createStudentSchema>;
export type EditStudentFormValues = z.infer<typeof editStudentSchema>;

/** Split "Firstname Lastname Other" → { firstName, lastName } */
export function splitFullName(fullName: string): {
	firstName: string;
	lastName: string;
} {
	const parts = fullName.trim().split(/\s+/);
	const firstName = parts[0] ?? '';
	const lastName = parts.slice(1).join(' ');
	return { firstName, lastName };
}
