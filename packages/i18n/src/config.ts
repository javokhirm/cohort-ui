import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Locale } from '@repo/utils';

import {
	DEFAULT_NS,
	FALLBACK_LOCALE,
	NAMESPACES,
	SUPPORTED_LOCALES,
	isLocale,
	resources,
} from './messages';

/**
 * Locale state, deliberately shaped like `@repo/ui`'s `initTheme`/`setTheme`
 * (packages/ui/src/lib/theme.ts): module-level value, one storage key per app,
 * and a listener set that `useLocale()` subscribes to via `useSyncExternalStore`.
 *
 * This module knows nothing about the API. Persisting a signed-in user's choice
 * to the server is the app's job (`PATCH /me/preferences`) — packages must not
 * import auth or api-client.
 */

/** Overwritten by `initI18n`; each app scopes its own key (`cohort.<app>.locale`). */
let storageKey = 'cohort.locale';
let locale: Locale = FALLBACK_LOCALE;
const listeners = new Set<() => void>();

/** The user's stored choice, or `null` if they have never picked one. */
function readStoredLocale(): Locale | null {
	try {
		const value = localStorage.getItem(storageKey);
		return isLocale(value) ? value : null;
	} catch {
		return null;
	}
}

function applyLocale(next: Locale): void {
	locale = next;
	// Drives `:lang()` styling, hyphenation, and screen-reader pronunciation.
	document.documentElement.lang = next;
	void i18next.changeLanguage(next);
	for (const listener of listeners) listener();
}

/**
 * Resolve and apply the boot locale, then initialise i18next once.
 *
 * Call from `main.tsx` before the first render, next to `initTheme(...)`. At
 * this point only `localStorage` is available — the signed-in user's stored
 * preference arrives later, on the login/refresh response, and the session
 * store hands it to {@link setLocale}.
 */
export function initI18n(options: { storageKey: string }): void {
	storageKey = options.storageKey;
	const initial = readStoredLocale() ?? FALLBACK_LOCALE;

	if (!i18next.isInitialized) {
		void i18next.use(initReactI18next).init({
			resources,
			lng: initial,
			fallbackLng: FALLBACK_LOCALE,
			supportedLngs: SUPPORTED_LOCALES,
			ns: NAMESPACES,
			defaultNS: DEFAULT_NS,
			// React already escapes everything it renders.
			interpolation: { escapeValue: false },
		});
	}

	applyLocale(initial);
}

/**
 * Record an explicit choice — from the switcher, or from the user's stored
 * preference on the login/refresh response. Ignores anything that is not a
 * supported code (e.g. a `null` preference from a user who never picked one),
 * which is what makes the user → tenant → localStorage → `uz` chain collapse
 * cleanly: an absent preference simply leaves the resolved locale alone.
 */
export function setLocale(next: Locale | null | undefined): void {
	if (!isLocale(next)) return;
	try {
		localStorage.setItem(storageKey, next);
	} catch {
		/* storage unavailable — the choice just won't survive a reload */
	}
	if (next !== locale) applyLocale(next);
}

export function getLocale(): Locale {
	return locale;
}

export function subscribeToLocale(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
