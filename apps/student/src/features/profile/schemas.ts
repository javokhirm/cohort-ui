import { z } from 'zod';

import { UZ_PHONE_REGEX } from '@repo/utils';
import type { Translator } from '@repo/i18n';

/**
 * The Profile screen's two editable contact fields.
 *
 * `phone` may be left blank: students authenticate with their `studentCode`, so
 * the number is contact data and the backend allows it to be absent or cleared
 * (api-reference §5.1). A blank one is sent as `null`. `email` stays required —
 * `PATCH /student/me` has no way to clear it.
 */
export function contactSchema(t: Translator<'validation'>) {
	return z.object({
		phone: z
			.union([z.literal(''), z.string().regex(UZ_PHONE_REGEX, t('phoneInvalid'))])
			.optional(),
		email: z
			.string()
			.trim()
			.min(1, t('required'))
			.pipe(z.email(t('emailInvalid'))),
	});
}

export type ContactInput = z.infer<ReturnType<typeof contactSchema>>;
