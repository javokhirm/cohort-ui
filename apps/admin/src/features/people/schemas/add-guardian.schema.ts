import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import type { useAppT } from '@/locales';

import {
	guardianConnectFields,
	guardianNameField,
	refineGuardianConnect,
} from './student-form.schema';

type PeopleT = ReturnType<typeof useAppT<'people'>>;

/**
 * Standalone add-guardian dialog schema — the same phone-first rules the
 * student form uses, so a sibling's parent is connected rather than duplicated
 * here too.
 *
 * The phone stays optional (a guardian has no login of their own, so it is
 * contact data): leave it blank and the dialog falls back to describing a brand
 * new person, who is always someone new because there is no key to match on.
 */
export function addGuardianSchema(t: Translator<'validation'>, tp: PeopleT) {
	return z
		.object({
			...guardianConnectFields(t),
			isPrimary: z.boolean(),
			canPickup: z.boolean(),
		})
		.superRefine((values, ctx) => {
			refineGuardianConnect(values, ctx, t, tp);

			// Unlike the student form, this dialog exists ONLY to add a guardian,
			// so an empty form is a mistake rather than "no guardian wanted".
			if (!values.guardianPhone) {
				const nameResult = guardianNameField(t, tp).safeParse(
					values.guardianName ?? '',
				);
				if (!nameResult.success) {
					ctx.addIssue({
						code: 'custom',
						path: ['guardianName'],
						message: nameResult.error.issues[0]?.message,
					});
				}
				if (!values.guardianRelation) {
					ctx.addIssue({
						code: 'custom',
						path: ['guardianRelation'],
						message: t('required'),
					});
				}
			}
		});
}

export type AddGuardianFormValues = z.infer<ReturnType<typeof addGuardianSchema>>;
