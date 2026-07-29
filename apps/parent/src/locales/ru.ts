import type { TranslationsOf } from '@repo/i18n';

import type { uz } from './uz';

/** Russian translation of the parent catalog. `uz` is the source of truth. */
export const ru: TranslationsOf<typeof uz> = {
	shell: {
		placeholderTitle: 'Кабинет родителя скоро откроется',
		placeholderDescription:
			'Посещаемость, оценки и оплаты вашего ребёнка пока в разработке.',
	},
};
