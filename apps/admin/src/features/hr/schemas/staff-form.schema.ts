import { z } from 'zod';

import type { Translator } from '@repo/i18n';
import { UZ_PHONE_REGEX } from '@repo/utils';

import type { useAppT } from '@/locales';

type HrT = ReturnType<typeof useAppT<'hr'>>;

/**
 * Staff form schemas. Factories rather than module constants because their
 * messages are user-facing — a literal captured at module load would never
 * re-translate on a language switch (conventions.md §7). Callers memoise on the
 * translator.
 */
function phoneField(t: Translator<'validation'>) {
	return z.string().min(1, t('required')).regex(UZ_PHONE_REGEX, t('phoneInvalid'));
}

function emailField(t: Translator<'validation'>) {
	return z.union([z.literal(''), z.email(t('emailInvalid'))]).optional();
}

/**
 * The initial login password, set only when registering a staff member. Blank is
 * allowed (the member sets their own later, from their account page), but anything
 * typed must clear the backend's 8–128 policy. Same blank-or-valid shape as `email`.
 *
 * Changing it afterwards is not part of the edit form — it is a separate,
 * confirm-guarded action (see {@link changeStaffPasswordSchema}) so a credential is
 * never rewritten as a side effect of saving unrelated profile fields.
 */
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

// The pay model (fixed/percent, salary, share) is no longer part of the staff
// forms — it lives on the dated payroll-config timeline (see
// `payroll-config-form.schema.ts` and the staff detail Payroll tab).

export function createStaffSchema(t: Translator<'validation'>) {
	return z.object({
		firstName: z.string().min(1, t('required')),
		lastName: z.string().min(1, t('required')),
		roleName: z.enum(['TEACHER', 'MANAGER', 'ADMIN'], { error: t('required') }),
		branchId: z.number({ error: t('required') }).min(1, t('required')),
		position: z.string().optional(),
		phone: phoneField(t),
		email: emailField(t),
		employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR']),
		hireDate: z.string().optional(),
		specialization: z.string().optional(),
		password: optionalPasswordField(t),
	});
}

export function editStaffSchema(t: Translator<'validation'>) {
	return z.object({
		firstName: z.string().min(1, t('required')),
		lastName: z.string().min(1, t('required')),
		phone: phoneField(t),
		email: emailField(t),
		position: z.string().optional(),
		employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR']),
		specialization: z.string().optional(),
		status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']),
	});
}

/**
 * Operator reset of a staff member's password (`PATCH /staff/:id` with only
 * `password`). `confirmPassword` is a client-side guard only — the server takes
 * just `password` — and matters more here than on `/account`, since the operator
 * cannot verify the result by signing in. Length mirrors the backend's 8–128 policy.
 */
export function changeStaffPasswordSchema(t: Translator<'validation'>, th: HrT) {
	return z
		.object({
			newPassword: z
				.string()
				.min(8, t('passwordMin', { count: 8 }))
				.max(128, t('maxLength', { count: 128 })),
			confirmPassword: z.string().min(1, th('password.confirmRequired')),
		})
		.refine((values) => values.newPassword === values.confirmPassword, {
			message: t('passwordMismatch'),
			path: ['confirmPassword'],
		});
}

export type CreateStaffFormValues = z.infer<ReturnType<typeof createStaffSchema>>;
export type EditStaffFormValues = z.infer<ReturnType<typeof editStaffSchema>>;
export type ChangeStaffPasswordFormValues = z.infer<
	ReturnType<typeof changeStaffPasswordSchema>
>;

/** Split "Physics, Chemistry" → ['Physics', 'Chemistry'] (empty → []). */
export function parseSpecialization(input?: string): string[] {
	if (!input) return [];
	return input
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}
