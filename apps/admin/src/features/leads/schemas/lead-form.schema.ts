import { z } from 'zod';

import type { Translator } from '@repo/i18n';
import { UZ_PHONE_REGEX } from '@repo/utils';

import { LEAD_LOGGABLE_ACTIVITY_TYPES, LEAD_SOURCES } from '../api/leads.queries';

/**
 * Factories, not constants — the messages are user-facing, so they resolve at
 * render rather than at module load (conventions.md §7). Callers memoise on the
 * translator.
 */
export function createLeadSchema(t: Translator<'validation'>) {
	return z.object({
		firstName: z.string().min(1, t('required')),
		lastName: z.string().optional().or(z.literal('')),
		phoneNumber: z.string().regex(UZ_PHONE_REGEX, t('phoneInvalid')),
		email: z.union([z.literal(''), z.email(t('emailInvalid'))]).optional(),
		source: z.enum(LEAD_SOURCES),
		branchId: z
			.number({ error: t('required') })
			.int()
			.positive()
			.optional(),
		courseInterestId: z.number().int().positive().optional(),
		assignedToStaffId: z.number().int().positive().optional(),
		notes: z.string().optional().or(z.literal('')),
	});
}

export type CreateLeadFormValues = z.infer<ReturnType<typeof createLeadSchema>>;

export function logActivitySchema() {
	return z.object({
		type: z.enum(LEAD_LOGGABLE_ACTIVITY_TYPES),
		notes: z.string().optional().or(z.literal('')),
	});
}

export type LogActivityFormValues = z.infer<ReturnType<typeof logActivitySchema>>;

/** Blank string in an optional text field → `undefined` (omit from the payload). */
export function blankToUndefined(value: string | undefined): string | undefined {
	return value === '' ? undefined : value;
}
