import type { TranslationsOf } from '@repo/i18n';

import type { uz } from './uz';

/** English translation of the parent catalog. `uz` is the source of truth. */
export const en: TranslationsOf<typeof uz> = {
	shell: {
		placeholderTitle: 'Parent area coming soon',
		placeholderDescription:
			"Your child's attendance, marks and payments are still being built.",
	},
};
