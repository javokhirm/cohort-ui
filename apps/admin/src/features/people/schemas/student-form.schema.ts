import { z } from 'zod';

import type { Translator } from '@repo/i18n';
import { UZ_PHONE_REGEX } from '@repo/utils';

import type { useAppT } from '@/locales';

type PeopleT = ReturnType<typeof useAppT<'people'>>;

/**
 * Student form schemas. Factories rather than module constants because their
 * messages are user-facing — a literal captured at module load would never
 * re-translate on a language switch (conventions.md §7). Callers memoise on the
 * translator.
 */
function phoneField(t: Translator<'validation'>) {
	return z.string().min(1, t('required')).regex(UZ_PHONE_REGEX, t('phoneInvalid'));
}

function optionalPasswordField(t: Translator<'validation'>) {
	return z
		.union([
			z.literal(''),
			z
				.string()
				.min(8, t('passwordMin', { count: 8 }))
				.max(128, t('maxLength', { count: 128 })),
		])
		.optional();
}

function guardianNameField(t: Translator<'validation'>, tp: PeopleT) {
	return z
		.string()
		.min(2, t('required'))
		.refine((v) => v.trim().includes(' '), {
			message: tp('form.validation.guardianFullName'),
		});
}

export function createStudentSchema(t: Translator<'validation'>, tp: PeopleT) {
	const phone = phoneField(t);
	const guardianName = guardianNameField(t, tp);

	return z
		.object({
			firstName: z.string().min(1, t('required')),
			lastName: z.string().min(1, t('required')),
			dateOfBirth: z.string().optional(),
			gender: z.enum(['M', 'F', 'O']).optional(),
			phone,
			branchId: z.number({ error: t('required') }).min(1, t('required')),
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
}

export function editStudentSchema(t: Translator<'validation'>) {
	return z.object({
		firstName: z.string().min(1, t('required')),
		lastName: z.string().min(1, t('required')),
		dateOfBirth: z.string().optional(),
		gender: z.enum(['M', 'F', 'O']).optional(),
		phone: phoneField(t),
		email: z.union([z.literal(''), z.email(t('emailInvalid'))]).optional(),
		branchId: z.number({ error: t('required') }).min(1, t('required')),
		address: z.string().optional(),
		status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED']).optional(),
		password: optionalPasswordField(t),
	});
}

export type CreateStudentFormValues = z.infer<ReturnType<typeof createStudentSchema>>;
export type EditStudentFormValues = z.infer<ReturnType<typeof editStudentSchema>>;

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
