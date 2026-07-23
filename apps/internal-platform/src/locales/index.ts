import { createAppT, registerAppLocales } from '@repo/i18n';

import { en } from './en';
import { ru } from './ru';
import { uz } from './uz';

/**
 * The internal platform console's feature catalogs.
 *
 * Shell copy (nav, auth, common actions, enum labels, validation) lives in
 * `@repo/i18n` and is reached with `useT(...)`; everything a `/super-admin`
 * screen says lives here and is reached with {@link useAppT}. The split keeps
 * this console's tenant/subscription copy out of the admin and teacher bundles
 * (docs/folder-structure.md).
 */

/**
 * Merge the catalogs into the shared i18next instance.
 *
 * Call from `main.tsx` (and `test/setup.ts`) immediately after `initI18n(...)`
 * — i18next has no resource store before it is initialised.
 */
export function initAppLocales(): void {
	registerAppLocales({ uz, ru, en });
}

/**
 * Typed translator for one feature namespace:
 * `const t = useAppT('tenants')` → `t('column.center')`.
 *
 * Keys are checked against `./uz.ts`, so a typo fails `check-types` instead of
 * rendering a raw key at runtime.
 */
export const useAppT = createAppT<typeof uz>();
