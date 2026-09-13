import { z } from 'zod';

import type { Translator } from '@repo/i18n';
import { UZ_PHONE_REGEX } from '@repo/utils';

import type { useAppT } from '@/locales';

type PeopleT = ReturnType<typeof useAppT<'people'>>;

/**
 * A phone that may be left blank but must be well-formed when filled.
 *
 * Students authenticate with their `studentCode`, not a number, and guardians
 * have no login at all — so the backend made `phone` optional for both
 * (api-reference §3.3). Plenty of learners are minors with no number of their
 * own, and a household often shares one across siblings and parents.
 */
export function optionalPhoneField(t: Translator<'validation'>) {
	return z
		.union([z.literal(''), z.string().regex(UZ_PHONE_REGEX, t('phoneInvalid'))])
		.optional();
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

export function guardianNameField(t: Translator<'validation'>, tp: PeopleT) {
	return z
		.string()
		.min(2, t('required'))
		.refine((v) => v.trim().includes(' '), {
			message: tp('form.validation.guardianFullName'),
		});
}

/**
 * What the phone lookup last said about `guardianPhone`, mirrored into form
 * state so validation can see it.
 *
 * The schema alone cannot tell "no guardian on this number, so type a name"
 * from "this number is already someone — confirm before saving", and getting
 * that wrong is exactly the duplicate-guardian bug this feature exists to
 * prevent. `GuardianPhoneField` writes this field as the query settles.
 *
 * - `idle`     — no number, or not a complete one yet
 * - `checking` — lookup in flight
 * - `found`    — the tenant already knows somebody on this number
 * - `linked`   — …and they already cover the student being edited
 * - `new`      — nobody here holds it, so the guardian must be described
 */
export const GUARDIAN_LOOKUP_STATES = [
	'idle',
	'checking',
	'found',
	'linked',
	'new',
] as const;
export type GuardianLookupState = (typeof GUARDIAN_LOOKUP_STATES)[number];

/** The guardian fields every surface that can connect a guardian shares. */
export function guardianConnectFields(t: Translator<'validation'>) {
	return {
		guardianPhone: optionalPhoneField(t),
		guardianName: z.string().optional(),
		guardianRelation: z.enum(['mother', 'father', 'guardian']).optional(),
		guardianLookupState: z.enum(GUARDIAN_LOOKUP_STATES),
		/**
		 * The user id of an existing guardian the operator explicitly confirmed.
		 * Undefined until they click "Connect guardian" — a phone that merely
		 * matches is never enough (the whole point of the confirmation step).
		 */
		connectedGuardianUserId: z.number().optional(),
	};
}

/**
 * Cross-field rules for the guardian block. Runs inside the host schema's
 * `superRefine` so each form keeps one resolver.
 *
 * A blank number means "no guardian" and clears every requirement. A filled one
 * requires either a confirmed match or a described new person — never a silent
 * link off a phone collision.
 */
export function refineGuardianConnect(
	values: {
		guardianPhone?: string;
		guardianName?: string;
		guardianRelation?: string;
		guardianLookupState: GuardianLookupState;
		connectedGuardianUserId?: number;
	},
	ctx: z.RefinementCtx,
	t: Translator<'validation'>,
	tp: PeopleT,
): void {
	const phone = values.guardianPhone ?? '';
	if (!phone) return;

	const phoneResult = optionalPhoneField(t).safeParse(phone);
	if (!phoneResult.success) {
		ctx.addIssue({
			code: 'custom',
			path: ['guardianPhone'],
			message: phoneResult.error.issues[0]?.message,
		});
		return;
	}

	// Already a guardian of this student: there is nothing to add, and sending
	// it anyway is a 409. Say so on the field instead of letting the server
	// reject the whole save.
	if (values.guardianLookupState === 'linked') {
		ctx.addIssue({
			code: 'custom',
			path: ['guardianPhone'],
			message: tp('form.validation.guardianAlreadyConnected'),
		});
		return;
	}

	if (!values.guardianRelation) {
		ctx.addIssue({
			code: 'custom',
			path: ['guardianRelation'],
			message: t('required'),
		});
	}

	if (values.guardianLookupState === 'checking') {
		ctx.addIssue({
			code: 'custom',
			path: ['guardianPhone'],
			message: tp('form.validation.guardianChecking'),
		});
		return;
	}

	// Somebody already holds this number. Saving without the operator's explicit
	// confirmation would link that person off a bare phone match — so block it
	// here rather than let the POST resolve them silently.
	if (values.guardianLookupState === 'found' && !values.connectedGuardianUserId) {
		ctx.addIssue({
			code: 'custom',
			path: ['guardianPhone'],
			message: tp('form.validation.guardianConfirmRequired'),
		});
		return;
	}

	// Nobody here holds it, so this guardian is a new person and needs a name.
	if (values.guardianLookupState !== 'found') {
		const nameResult = guardianNameField(t, tp).safeParse(values.guardianName ?? '');
		if (!nameResult.success) {
			ctx.addIssue({
				code: 'custom',
				path: ['guardianName'],
				message: nameResult.error.issues[0]?.message,
			});
		}
	}
}

export function createStudentSchema(t: Translator<'validation'>, tp: PeopleT) {
	return z
		.object({
			firstName: z.string().min(1, t('required')),
			lastName: z.string().min(1, t('required')),
			dateOfBirth: z.string().optional(),
			gender: z.enum(['M', 'F', 'O']).optional(),
			phone: optionalPhoneField(t),
			branchId: z.number({ error: t('required') }).min(1, t('required')),
			address: z.string().optional(),

			// The guardian block is driven entirely by the phone: leave it blank
			// and the student is created with no guardian at all.
			...guardianConnectFields(t),

			// No fee plan: the student bills on the plan attached to the group's course.
			groupId: z.number().optional(),
		})
		.superRefine((values, ctx) => refineGuardianConnect(values, ctx, t, tp));
}

export function editStudentSchema(t: Translator<'validation'>, tp: PeopleT) {
	return z
		.object({
			firstName: z.string().min(1, t('required')),
			lastName: z.string().min(1, t('required')),
			dateOfBirth: z.string().optional(),
			gender: z.enum(['M', 'F', 'O']).optional(),
			phone: optionalPhoneField(t),
			email: z.union([z.literal(''), z.email(t('emailInvalid'))]).optional(),
			branchId: z.number({ error: t('required') }).min(1, t('required')),
			address: z.string().optional(),
			status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED']).optional(),
			password: optionalPasswordField(t),

			// Connecting ANOTHER guardian is optional on edit; the ones already
			// linked are listed above the field and are not re-sent on save.
			...guardianConnectFields(t),
		})
		.superRefine((values, ctx) => refineGuardianConnect(values, ctx, t, tp));
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
