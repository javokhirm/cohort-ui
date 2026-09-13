import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import type { useAppT } from '@/locales';

import { guardianNameField, optionalPhoneField } from './student-form.schema';

type PeopleT = ReturnType<typeof useAppT<'people'>>;

/**
 * Standalone add-guardian dialog schema — reuses the same field rules as the
 * inline guardian section on `CreateStudentForm`.
 *
 * The phone is optional (a guardian has no login of their own, so it is contact
 * data); the name is not, because without a number there is no key to match an
 * existing person on and the guardian is always someone new.
 */
export function addGuardianSchema(t: Translator<'validation'>, tp: PeopleT) {
	return z.object({
		guardianName: guardianNameField(t, tp),
		guardianPhone: optionalPhoneField(t),
		guardianRelation: z.enum(['mother', 'father', 'guardian']),
		isPrimary: z.boolean(),
		canPickup: z.boolean(),
	});
}

export type AddGuardianFormValues = z.infer<ReturnType<typeof addGuardianSchema>>;
