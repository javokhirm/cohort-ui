import type { MarkScale } from '../api/students.queries';

/**
 * Turning a stamped {@link MarkScale} into what an operator reads on the
 * Performance tab.
 *
 * The API deliberately sends no prose for a scale — only `type`/`maxPoints` — so
 * the unit and the scale's name are composed here and translated through the app
 * catalog, exactly as attendance statuses are.
 *
 * The student app has an equivalent module for its own Progress screen. These
 * are intentionally **not** shared: promoting anything into `@repo/*` is the
 * engineer's call (see the repo CLAUDE.md), and an app may not import from a
 * sibling app. Flagged as a promotion candidate rather than reached across.
 */

/** The value as the teacher entered it: `8/10`, `B`, `88%`. */
export function markValueLabel(
	scale: MarkScale,
	rawScore: number | null,
	letter: string | null,
): string {
	if (scale.type === 'LETTER') return letter ?? '—';
	if (rawScore === null) return '—';
	if (scale.type === 'PERCENTAGE') return `${rawScore}%`;
	return `${rawScore}/${scale.maxPoints ?? '—'}`;
}

/**
 * The scale's name, for the average card's caption ("marked on the 0–10 points
 * scale"). Letter scales are a fixed A–F set and percentages a fixed symbol, so
 * only POINTS interpolates its own maximum.
 */
export function scaleNameLabel(
	scale: MarkScale,
	t: (
		key: 'scaleLetter' | 'scalePercent' | 'scalePoints',
		vars?: { max: number },
	) => string,
): string {
	if (scale.type === 'LETTER') return t('scaleLetter');
	if (scale.type === 'PERCENTAGE') return t('scalePercent');
	return t('scalePoints', { max: scale.maxPoints ?? 0 });
}

/** Tone buckets shared by the mark cells and the average card. */
export type MarkTone = 'green' | 'indigo' | 'amber' | 'red';

/**
 * The tone a mark reads in, keyed off `normalizedPct` so a `B`, an `8/10` and an
 * `85%` of equal standing are coloured alike — which is the whole reason the API
 * carries a normalized percentage alongside the raw value.
 */
export function markTone(normalizedPct: number): MarkTone {
	if (normalizedPct >= 85) return 'green';
	if (normalizedPct >= 70) return 'indigo';
	if (normalizedPct >= 55) return 'amber';
	return 'red';
}

/** Foreground class per tone (the shared `tone-*` palette). */
export const MARK_TONE_FG: Record<MarkTone, string> = {
	green: 'text-tone-green-fg',
	indigo: 'text-tone-indigo-fg',
	amber: 'text-tone-amber-fg',
	red: 'text-tone-red-fg',
};

/**
 * The "Average session mark" headline: the average on its own axis when every
 * mark in the window shares one numeric scale, else the cross-scale percentage.
 * `null` when nothing has been marked.
 */
export function averageMarkLabel(
	averageRaw: number | null,
	averagePct: number | null,
	scales: MarkScale[],
): string | null {
	if (averagePct === null) return null;
	if (averageRaw === null) return `${averagePct}%`;
	const [scale] = scales;
	return scale?.type === 'PERCENTAGE' ? `${averageRaw}%` : String(averageRaw);
}
