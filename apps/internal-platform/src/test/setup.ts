import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

import { initI18n, setLocale } from '@repo/i18n';

import { initAppLocales } from '@/locales';

import { useSessionStore } from '@/store/sessionStore';
import { server } from './server';

// Components now render copy via `useT`; without an initialised i18next, `t()`
// returns raw keys. Tests assert against the English catalog, so pin English.
initI18n({ storageKey: 'cohort.internal.locale' });
initAppLocales();
setLocale('en');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
	server.resetHandlers();
	cleanup();
	localStorage.clear();
	useSessionStore.setState({ accessToken: null, user: null, status: 'unknown' });
});

afterAll(() => server.close());
