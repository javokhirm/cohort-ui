import * as React from 'react';
import i18next from 'i18next';
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

/**
 * Translate outside React.
 *
 * A few call sites are module-scope and can never call a hook — the TanStack
 * Query/Mutation cache error handlers being the canonical case. They still need
 * localized copy, so this reads the same i18next instance `useT` does. Prefer
 * {@link useT} everywhere a hook is legal: unlike a hook, this does not
 * re-render anything when the language changes, which is fine for a toast fired
 * at the moment of the failure but wrong for rendered copy.
 */
export function translate<N extends Namespace>(
	ns: N,
	key: Parameters<Translator<N>>[0],
): string {
	return i18next.t(key as never, { ns }) as string;
}
