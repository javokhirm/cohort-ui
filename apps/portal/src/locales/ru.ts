import type { TranslationsOf } from '@repo/i18n';

import type { uz } from './uz';

/** Russian translation of the portal catalog. `uz` is the source of truth. */
export const ru: TranslationsOf<typeof uz> = {
	shell: {
		placeholderTitle: 'Портал скоро откроется',
		placeholderDescription:
			'Личный кабинет для учеников и родителей пока в разработке.',
	},
};
