import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

import { initI18n, setLocale } from '@repo/i18n';

import { initAppLocales } from '@/locales';

import { useSessionStore } from '@/store/sessionStore';

// Components render copy via `useT`; without an initialised i18next, `t()` yields
// raw keys. Tests assert against the English catalog, so pin English.
initI18n({ storageKey: 'cohort.teacher.locale' });
initAppLocales();
setLocale('en');

// jsdom has no ResizeObserver; Radix's Dropdown/Dialog primitives need one.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
	cleanup();
	localStorage.clear();
	useSessionStore.setState({ accessToken: null, user: null, status: 'unknown' });
});
