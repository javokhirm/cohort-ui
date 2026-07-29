import type { TranslationsOf } from '@repo/i18n';

import type { uz } from './uz';

/** English translation of the portal catalog. `uz` is the source of truth. */
export const en: TranslationsOf<typeof uz> = {
	shell: {
		placeholderTitle: 'Portal coming soon',
		placeholderDescription:
			'The self-service area for students and parents is still being built.',
	},
};
