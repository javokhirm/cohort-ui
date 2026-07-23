import * as React from 'react';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';

interface I18nProviderProps {
	children: React.ReactNode;
}

/**
 * Puts the shared i18next instance on context. Wrap `<App/>` in `main.tsx`,
 * after `initI18n(...)` has run — this provider does not initialise anything
 * itself, so that boot order stays explicit and matches `initTheme`.
 */
export function I18nProvider({ children }: I18nProviderProps) {
	return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
