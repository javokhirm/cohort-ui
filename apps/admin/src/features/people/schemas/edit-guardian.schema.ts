import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import { optionalPhoneField } from './student-form.schema';

/** A factory — user-facing messages must resolve at render (conventions.md §7). */
export function editGuardianSchema(t: Translator<'validation'>) {
	return z.object({
		firstName: z.string().min(1, t('required')),
		lastName: z.string().min(1, t('required')),
		phone: optionalPhoneField(t),
	});
}

export type EditGuardianFormValues = z.infer<ReturnType<typeof editGuardianSchema>>;
