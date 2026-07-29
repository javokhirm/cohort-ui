/**
 * Parent app — **source-of-truth catalog** for this app's feature screens.
 *
 * Shell vocabulary (nav, auth, common actions, table states, enum labels,
 * validation) is NOT here — it lives in `@repo/i18n` and is reached with
 * `useT(...)`. This file holds only copy this app's screens say, so the admin,
 * teacher, student and internal-platform bundles never carry it
 * (docs/folder-structure.md).
 *
 * One namespace per feature folder under `src/features/`. `ru.ts` and `en.ts`
 * annotate themselves against this file's shape, so a key added here without a
 * translation fails `check-types` there.
 *
 * Uses the modifier letter ʻ (U+02BB) for oʻ/gʻ — the correct character, and it
 * never collides with the surrounding JS quotes.
 */
export const uz = {
	shell: {
		placeholderTitle: 'Ota-onalar kabineti tez orada',
		placeholderDescription:
			'Farzandingizning davomati, baholari va toʻlovlarini kuzatish imkoniyati hozircha tayyorlanmoqda.',
	},
} as const;
