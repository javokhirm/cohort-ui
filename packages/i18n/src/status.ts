import { useTranslation } from 'react-i18next';

import { uz } from './messages/uz';

/**
 * Localized labels for domain statuses.
 *
 * `@repo/ui` owns how a status *looks* — `resolveStatus(kind, status)` returns
 * the tone that drives `StatusBadge`'s colors. The *words* are content, so they
 * live in the `enums.domain.*` catalog here and reach the badge as `children`:
 *
 * ```tsx
 * const label = useStatusLabel();
 * <StatusBadge kind="invoice" status={invoice.status}>
 *   {label('invoice', invoice.status)}
 * </StatusBadge>
 * ```
 *
 * That keeps the two packages peers (conventions.md §7 — `@repo/ui` never
 * imports `@repo/i18n`; presentational components take copy as props) and, since
 * the hook subscribes through `useTranslation`, every badge repaints on a
 * language switch.
 */

/** Status groups the catalog covers — mirrors `@repo/ui`'s `StatusKind`. */
export type StatusKind = keyof (typeof uz)['enums']['domain'];

/**
 * Backend values arrive in whatever shape the API uses (`ON_LEAVE`, `on-leave`,
 * `On Leave`); catalog keys are lowercase and `_`-joined. Same normalization as
 * `@repo/ui`'s `resolveStatus`, so the two can't disagree about which entry a
 * raw value maps to.
 */
function normalize(status: string): string {
	return status
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, '_');
}

/** Last resort for a status the catalog hasn't caught up with: `on_leave` → `On leave`. */
function toTitle(status: string): string {
	const clean = status.trim().replace(/[_-]+/g, ' ');
	return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

/**
 * Returns a `(kind, status) => label` resolver.
 *
 * An unknown status degrades to a title-cased version of the raw value rather
 * than rendering a raw key — a newly-added backend status stays readable until
 * the catalog catches up.
 */
export function useStatusLabel(): (kind: StatusKind, status: string) => string {
	const { t } = useTranslation('enums');

	return (kind, status) => {
		const key = `domain.${kind}.${normalize(status)}`;
		// `defaultValue` keeps i18next from echoing the key back on a miss.
		const label = t(key as never, { defaultValue: '' }) as string;
		return label || toTitle(status);
	};
}
