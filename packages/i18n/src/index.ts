export { getLocale, initI18n, setLocale, subscribeToLocale } from './config';

export { translate, useLocale, useT } from './hooks';

export type { Translator } from './hooks';

export { createAppT, registerAppLocales } from './app';

export { useStatusLabel } from './status';

export type { StatusKind } from './status';

export type {
	AppCatalog,
	AppTFunction,
	MessageKey,
	MessageTree,
	MessageVars,
	TranslationsOf,
} from './app';

export { I18nProvider } from './provider';

export { FALLBACK_LOCALE, SUPPORTED_LOCALES, isLocale } from './messages';

// Re-exported (not just declared) so the `i18next` module augmentation in
// `./types` is pulled into every consuming app's program — that is what makes
// `t()` key-checked outside this package.
export type { Namespace } from './types';

export type { Locale } from '@repo/utils';
