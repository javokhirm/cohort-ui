export { getLocale, initI18n, setLocale, subscribeToLocale } from './config';

export { useLocale, useT } from './hooks';

export { I18nProvider } from './provider';

export { FALLBACK_LOCALE, SUPPORTED_LOCALES, isLocale } from './messages';

// Re-exported (not just declared) so the `i18next` module augmentation in
// `./types` is pulled into every consuming app's program — that is what makes
// `t()` key-checked outside this package.
export type { Namespace } from './types';

export type { Locale } from '@repo/utils';
