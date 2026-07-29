import { createAppT, registerAppLocales } from '@repo/i18n';

import { en } from './en';
import { ru } from './ru';
import { uz } from './uz';

/**
 * The student app's feature catalogs.
 *
 * Shell copy (nav, auth, common actions, enum labels, validation) lives in
 * `@repo/i18n` and is reached with `useT(...)`; everything a student screen
 * says lives here and is reached with {@link useAppT}. The split keeps admin's
 * billing and payroll copy out of this phone-first bundle
 * (docs/folder-structure.md).
 */

/**
 * Merge the catalogs into the shared i18next instance.
 *
 * Call from `main.tsx` immediately after `initI18n(...)` — i18next has no
 * resource store before it is initialised.
 */
export function initAppLocales(): void {
	registerAppLocales({ uz, ru, en });
}

/**
 * Typed translator for one feature namespace:
 * `const t = useAppT('shell')` → `t('placeholderTitle')`.
 *
 * Keys are checked against `./uz.ts`, so a typo fails `check-types` instead of
 * rendering a raw key at runtime.
 */
export const useAppT = createAppT<typeof uz>();
