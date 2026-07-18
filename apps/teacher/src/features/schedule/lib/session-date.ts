import { formatShortDate } from '@repo/utils';

/**
 * "25 Jun" — the day-and-month half of `formatShortDate`'s "Wed, 25 Jun".
 *
 * `@repo/utils` has no `d MMM` formatter (only `formatWeekday`, `formatDayOfMonth`
 * and the combined `formatShortDate`), and the schedule row splits the weekday
 * onto its own line. Composing from the helper that already exists keeps the
 * locale and timezone rules in one place instead of re-deriving them here.
 * Flag for promotion to `@repo/utils` if a second screen needs it.
 */
export function formatDayMonth(iso: string): string {
	const [, dayMonth] = formatShortDate(iso).split(', ');
	return dayMonth ?? formatShortDate(iso);
}
