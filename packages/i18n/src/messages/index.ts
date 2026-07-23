import type { Locale } from '@repo/utils';

import { en } from './en';
import { ru } from './ru';
import { uz } from './uz';

/**
 * The locales the product ships, in menu order. Mirrors the backend's
 * `SUPPORTED_LOCALES` (cohort-be `src/common/localization/language.entity.ts`) —
 * the DB `languages` table constrains stored preferences to exactly these codes.
 */
export const SUPPORTED_LOCALES = ['uz', 'ru', 'en'] as const satisfies readonly Locale[];

/** Uzbek is the market default and the source-of-truth catalog. */
export const FALLBACK_LOCALE: Locale = 'uz';

/** i18next namespaces, derived from the catalog so the two can never drift. */
export const NAMESPACES = ['common', 'auth', 'nav', 'enums', 'validation'] as const;

export const DEFAULT_NS = 'common' as const;

export const resources = { uz, ru, en } as const;

export function isLocale(value: unknown): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value as string);
}
