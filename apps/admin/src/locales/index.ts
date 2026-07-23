import { createAppT, registerAppLocales } from '@repo/i18n';

import { en } from './en';
import { ru } from './ru';
import { uz } from './uz';

/**
 * The admin console's feature catalogs.
 *
 * Shell copy lives in `@repo/i18n` and is reached with `useT(...)`; everything
 * a `/manage` screen says lives here and is reached with {@link useAppT}. The
 * split is deliberate — it is what keeps admin's ~900 billing/payroll strings
 * out of the teacher and internal-platform bundles.
 */

/**
 * Merge the catalogs into the shared i18next instance.
 *
 * Call from `main.tsx` (and `test/setup.ts`) immediately after `initI18n(...)`
 * — i18next has no resource store before it is initialised, so this cannot be a
 * module-load side effect.
 */
export function initAppLocales(): void {
	registerAppLocales({ uz, ru, en });
}

/**
 * Typed translator for one feature namespace:
 * `const t = useAppT('branches')` → `t('field.name')`.
 *
 * Keys are checked against `./uz.ts`, so a typo fails `check-types` instead of
 * rendering a raw key at runtime.
 */
export const useAppT = createAppT<typeof uz>();
