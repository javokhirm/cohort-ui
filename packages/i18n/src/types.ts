import type { resources } from './messages';

/** A catalog section — the argument `useT()` takes. */
export type Namespace = keyof (typeof resources)['uz'];

/**
 * Teach i18next about our catalog so `t('action.save')` is key-checked and a
 * typo fails `check-types` instead of silently rendering the raw key at runtime.
 * `uz` is the source of truth (see `./messages/uz.ts`).
 *
 * This lives in a `.ts` (not `.d.ts`) that the barrel re-exports from, so the
 * augmentation is pulled into every consuming app's program via the normal
 * import graph — a stray `.d.ts` would only be picked up by this package.
 */
declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: 'common';
		resources: (typeof resources)['uz'];
	}
}
