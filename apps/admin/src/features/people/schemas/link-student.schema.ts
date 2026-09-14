import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import { GUARDIAN_RELATIONS } from '../lib/guardian-input';

/** A factory — user-facing messages must resolve at render (conventions.md §7). */
export function linkStudentSchema(t: Translator<'validation'>) {
	return z.object({
		studentId: z.number({ error: t('required') }).positive(t('required')),
		relation: z.enum(GUARDIAN_RELATIONS, { error: t('required') }),
		isPrimary: z.boolean(),
		canPickup: z.boolean(),
	});
}

export type LinkStudentFormValues = z.infer<ReturnType<typeof linkStudentSchema>>;
