import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@repo/utils';

import { getLocale, setLocale, subscribeToLocale } from './config';
import { SUPPORTED_LOCALES } from './messages';
import type { Namespace } from './types';

/**
 * Translator for one namespace: `const t = useT('nav')` → `t('item.students')`.
 *
 * A thin wrapper over `useTranslation` so components never import `react-i18next`
 * directly — the runtime stays swappable behind this package's barrel, and keys
 * are checked against the catalog (see `./types.ts`).
 */
export function useT<N extends Namespace>(ns: N) {
	const { t } = useTranslation(ns);
	return t;
}

/**
 * The translator `useT(ns)` hands back, as a standalone type.
 *
 * Zod schemas cannot call a hook, so any schema carrying user-facing messages is
 * a factory that takes the translator instead of holding literals at module load
 * (conventions.md §7 — a module-level literal would never re-translate on a
 * language switch). Those factories type their parameter as
 * `Translator<'validation'>`, which keeps the message keys checked.
 */
export type Translator<N extends Namespace> = ReturnType<typeof useT<N>>;

interface UseLocaleResult {
	locale: Locale;
	setLocale: (next: Locale) => void;
	locales: readonly Locale[];
}

/** Reactive access to the active locale — re-renders on every change. */
export function useLocale(): UseLocaleResult {
	const current = React.useSyncExternalStore(subscribeToLocale, getLocale, getLocale);
	return { locale: current, setLocale, locales: SUPPORTED_LOCALES };
}
