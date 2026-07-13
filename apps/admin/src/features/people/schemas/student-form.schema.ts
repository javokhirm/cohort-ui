import { z } from 'zod';

import { UZ_PHONE_REGEX } from '@repo/utils';

const phone = z
	.string()
	.min(1, 'Phone is required')
	.regex(UZ_PHONE_REGEX, 'Enter a valid phone number');

const guardianName = z
	.string()
	.min(2, 'Guardian name is required')
	.refine((v) => v.trim().includes(' '), {
		message: 'Please enter both first and last name',
	});

export const createStudentSchema = z
	.object({
		firstName: z.string().min(1, 'First name is required'),
		lastName: z.string().min(1, 'Last name is required'),
		dateOfBirth: z.string().optional(),
		gender: z.enum(['M', 'F', 'O']).optional(),
		phone,
		branchId: z.number({ error: 'Branch is required' }).min(1, 'Branch is required'),
		address: z.string().optional(),

		// Guardian section is optional and hidden until the user opts in.
		hasGuardian: z.boolean(),
		guardianName: z.string().optional(),
		guardianPhone: z.string().optional(),
		guardianRelation: z.enum(['mother', 'father', 'guardian']).optional(),

		// No fee plan: the student bills on the plan attached to the group's course.
		groupId: z.number().optional(),
	})
	.superRefine((values, ctx) => {
		if (!values.hasGuardian) return;

		const nameResult = guardianName.safeParse(values.guardianName ?? '');
		if (!nameResult.success) {
			ctx.addIssue({
				code: 'custom',
				path: ['guardianName'],
				message: nameResult.error.issues[0]?.message,
			});
		}

		const phoneResult = phone.safeParse(values.guardianPhone ?? '');
		if (!phoneResult.success) {
			ctx.addIssue({
				code: 'custom',
				path: ['guardianPhone'],
				message: phoneResult.error.issues[0]?.message,
			});
		}
	});

export const editStudentSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
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
