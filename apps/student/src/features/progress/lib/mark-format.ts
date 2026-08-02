import type { ClassLogEntry } from '../api/class-log.queries';
import type { MarkScale } from '../api/marks.queries';

/**
 * Turning a stamped {@link MarkScale} into what a student reads.
 *
 * The API deliberately sends no prose for a scale — only `type`/`maxPoints` —
 * so the unit and the scale's name are composed here and translated through the
 * app catalog, exactly as attendance statuses are. Keeping it in one module
 * means the chip, the chart, Home's card and the session sheet can never drift
 * into describing the same mark two different ways.
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

/** The compact value for a chart bar, where the unit is implied by the axis. */
export function markShortLabel(
	scale: MarkScale,
	rawScore: number | null,
	letter: string | null,
): string {
	if (scale.type === 'LETTER') return letter ?? '—';
	return rawScore === null ? '—' : String(rawScore);
}

/**
 * The unit caption under a mark chip. Letter scales are a fixed A–F set and
 * percentages a fixed symbol, so only POINTS interpolates its own maximum.
 */
export function scaleUnitLabel(
	scale: MarkScale,
	t: (
		key: 'unitLetter' | 'unitPercent' | 'unitPoints',
		vars?: { max: number },
	) => string,
): string {
	if (scale.type === 'LETTER') return t('unitLetter');
	if (scale.type === 'PERCENTAGE') return t('unitPercent');
	return t('unitPoints', { max: scale.maxPoints ?? 0 });
}

/** The scale's full name, for the average card's note and the scale-change strip. */
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

/**
 * The "Earlier scale" name to show above a class-log row, or `null`.
 *
 * A boundary exists when the row and the next-older one carry marks measured on
 * different scales **within the same group** — across groups the scales differ by
 * definition, which is not the mid-term switch the strip is describing.
 */
export function earlierScaleNameFor(
	entry: ClassLogEntry,
	older: ClassLogEntry | undefined,
	t: Parameters<typeof scaleNameLabel>[1],
): string | null {
	if (!older?.mark || !entry.mark) return null;
	if (older.groupId !== entry.groupId) return null;
	if (older.mark.scale.configId === entry.mark.scale.configId) return null;
	return scaleNameLabel(older.mark.scale, t);
}

/** Tone buckets shared by the mark chips and the chart bars. */
export type MarkTone = 'green' | 'indigo' | 'amber' | 'red';

/**
 * The tone a mark reads in, keyed off `normalizedPct` so a `B`, an `8/10` and
 * an `85%` of equal standing are coloured alike.
 */
export function markTone(normalizedPct: number): MarkTone {
	if (normalizedPct >= 85) return 'green';
	if (normalizedPct >= 70) return 'indigo';
	if (normalizedPct >= 55) return 'amber';
	return 'red';
}

/** Tailwind background/foreground pairs per tone (the shared `tone-*` palette). */
export const MARK_TONE_CLASS: Record<MarkTone, { bg: string; fg: string }> = {
	green: { bg: 'bg-tone-green-bg', fg: 'text-tone-green-fg' },
	indigo: { bg: 'bg-tone-indigo-bg', fg: 'text-tone-indigo-fg' },
	amber: { bg: 'bg-tone-amber-bg', fg: 'text-tone-amber-fg' },
	red: { bg: 'bg-tone-red-bg', fg: 'text-tone-red-fg' },
};

/**
 * A chart bar's height as a percentage of the plot area.
 *
 * Bars are floored at 14% and scaled across the 40–100 band rather than 0–100:
 * daily marks cluster in the upper range, so a full-range axis would flatten
 * every bar into the same stub and hide exactly the variation the chart exists
 * to show. Anything at or below 40% still renders at the floor, so a bad mark is
 * visible rather than absent.
 */
export function markBarHeightPct(normalizedPct: number): number {
	const above = Math.max(0, normalizedPct - 40);
	return 14 + Math.min(1, above / 60) * 86;
}
