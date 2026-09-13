import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import type { useAppT } from '@/locales';

import { guardianNameField, phoneField } from './student-form.schema';

type PeopleT = ReturnType<typeof useAppT<'people'>>;

/** Standalone add-guardian dialog schema — reuses the same field rules as the
 * inline guardian section on `CreateStudentForm`. */
export function addGuardianSchema(t: Translator<'validation'>, tp: PeopleT) {
	return z.object({
		guardianName: guardianNameField(t, tp),
		guardianPhone: phoneField(t),
		guardianRelation: z.enum(['mother', 'father', 'guardian']),
		isPrimary: z.boolean(),
		canPickup: z.boolean(),
	});
}

export type AddGuardianFormValues = z.infer<ReturnType<typeof addGuardianSchema>>;
