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
