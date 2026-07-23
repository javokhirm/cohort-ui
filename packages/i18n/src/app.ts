import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@repo/utils';

import type { Namespace } from './types';

/**
 * Typed access to an **app-owned** catalog.
 *
 * Shell vocabulary (nav, auth, common actions, enums, validation) lives in this
 * package and is reached with {@link useT}. Feature-screen copy does not — it
 * stays in the app under `apps/<app>/src/locales/` so the teacher bundle never
 * ships admin's billing strings (docs/folder-structure.md). Those catalogs are
 * merged into the shared i18next instance at boot via {@link registerAppLocales}.
 *
 * The only thing an app cannot do for itself is *type* the result: i18next's
 * `CustomTypeOptions.resources` augmentation is declared once, in `./types.ts`,
 * and TypeScript forbids a second declaration of the same property — so an app
 * that augmented it again would fail to compile. {@link createAppT} closes that
 * gap by deriving the key union structurally from the app's own `uz` catalog,
 * which keeps the promise made in conventions.md §7: a typo in `t()` fails
 * `check-types` rather than rendering a raw key at runtime.
 *
 * This module stays generic over whatever catalog it is handed — it imports
 * nothing app-specific, so the package/app dependency direction is unchanged.
 */

/** A namespace's messages: a nested tree bottoming out in strings. */
export type MessageTree = { readonly [key: string]: string | MessageTree };

/** One locale's app catalog — namespace → message tree. */
export type AppCatalog = { readonly [namespace: string]: MessageTree };

/** Interpolation values: `t('greeting', { name })`. Never concatenate. */
export type MessageVars = Record<string, unknown>;

/**
 * i18next resolves `sessions_one` / `sessions_other` from a single `t('sessions',
 * { count })` call, so the suffixed catalog entries must collapse back to their
 * base key in the type — otherwise the callable key would be the one form no
 * caller ever writes. `_many` is the Russian form; `uz` and `en` use `_one`/`_other`.
 */
type PluralSuffix = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

type BaseKey<K extends string> = K extends `${infer Stem}_${PluralSuffix}` ? Stem : K;

/** Dot-joined leaf paths of a message tree — exactly what `t()` accepts. */
export type MessageKey<T> = {
	[K in keyof T & string]: T[K] extends string
		? BaseKey<K>
		: `${K}.${MessageKey<T[K]>}`;
}[keyof T & string];

/** The translator {@link createAppT}'s hook returns, key-checked against `T`. */
export type AppTFunction<T> = (key: MessageKey<T>, vars?: MessageVars) => string;

/**
 * The source catalog's shape with every leaf widened to `string` — the type a
 * translation annotates itself with:
 *
 * ```ts
 * export const ru: TranslationsOf<typeof uz> = { … };
 * ```
 *
 * A key missing from `ru` or a key `uz` doesn't have then fails `check-types` in
 * the translation file itself, which is where the mistake was made.
 */
export type TranslationsOf<T> = {
	[K in keyof T]: T[K] extends string ? string : TranslationsOf<T[K]>;
} & {
	// Languages don't agree on how many plural forms exist: `uz` and `en` need
	// `_one`/`_other`, `ru` also needs `_few` and `_many`. So wherever the source
	// catalog declares one plural form, a translation may add the siblings its
	// own grammar requires — required keys above, optional extras here.
	[K in PluralSiblings<keyof T & string>]?: string;
};

type PluralSiblings<K extends string> = K extends `${infer Stem}_${PluralSuffix}`
	? `${Stem}_${PluralSuffix}`
	: never;

/**
 * Merge an app's catalogs into the shared i18next instance.
 *
 * Call **after** `initI18n(...)` and before the first render — i18next has no
 * resource store until it is initialised. Apps do this from `main.tsx` (and
 * `test/setup.ts`) rather than at module load, so the boot order stays explicit
 * and matches `initTheme` / `initI18n`.
 */
export function registerAppLocales(bundles: Record<Locale, AppCatalog>): void {
	for (const [locale, catalog] of Object.entries(bundles)) {
		for (const [namespace, messages] of Object.entries(catalog)) {
			// deep = true, overwrite = true — an app key shadows a shared one of the
			// same name rather than being silently dropped.
			i18next.addResourceBundle(locale, namespace, messages, true, true);
		}
	}
}

/**
 * Build the app's typed translator hook, once, from its source-of-truth catalog:
 *
 * ```ts
 * // apps/admin/src/locales/index.ts
 * export const useAppT = createAppT<typeof uz>();
 *
 * // in a component
 * const t = useAppT('students');
 * t('form.firstName');
 * ```
 *
 * `ru` and `en` are not part of the type on purpose — `uz` is the source of
 * truth, and each catalog is declared `satisfies typeof uz` in its own file, so
 * a key missing from a translation fails `check-types` there instead of here.
 */
export function createAppT<C extends AppCatalog>() {
	return function useAppT<N extends keyof C & string>(
		namespace: N,
	): AppTFunction<C[N]> {
		// The app's namespaces are registered at runtime, so they are absent from
		// the compile-time augmentation `useTranslation` is typed against. The
		// cast is the seam; `AppTFunction` restores key checking on the way out.
		const { t } = useTranslation(namespace as unknown as Namespace);
		return t as unknown as AppTFunction<C[N]>;
	};
}
