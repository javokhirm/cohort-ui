import { z } from 'zod';

import { UZ_PHONE_REGEX } from '@repo/utils';
import type { Translator } from '@repo/i18n';

/**
 * The Profile screen's two editable contact fields.
 *
 * Both are required rather than optional: `PATCH /student/me` has no way to *clear*
 * either one (`phone` isn't nullable on `UpdateIdentityInput`; `email`'s
 */
export function contactSchema(t: Translator<'validation'>) {
	return z.object({
		phone: z.string().min(1, t('required')).regex(UZ_PHONE_REGEX, t('phoneInvalid')),
		email: z
			.string()
			.trim()
			.min(1, t('required'))
			.pipe(z.email(t('emailInvalid'))),
	});
}

export type ContactInput = z.infer<ReturnType<typeof contactSchema>>;
