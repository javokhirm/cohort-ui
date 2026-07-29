import type { TranslationsOf } from '@repo/i18n';

import type { uz } from './uz';

/** English translation of the student catalog. `uz` is the source of truth. */
export const en: TranslationsOf<typeof uz> = {
	shell: {
		placeholderTitle: 'Student area coming soon',
		placeholderDescription:
			'Your schedule, attendance and payments are still being built.',
	},
};
