import type { TranslationsOf } from '@repo/i18n';

import type { uz } from './uz';

/** Russian translation of the student catalog. `uz` is the source of truth. */
export const ru: TranslationsOf<typeof uz> = {
	shell: {
		placeholderTitle: 'Кабинет ученика скоро откроется',
		placeholderDescription: 'Расписание, посещаемость и оплаты пока в разработке.',
	},
};
