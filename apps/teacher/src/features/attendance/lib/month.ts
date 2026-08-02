import { todayIsoDate } from '@repo/utils';

/**
 * Month helpers for the monthly grid (`YYYY-MM`). Kept feature-local for now —
 * `@repo/utils` ships week helpers but no month ones; promote there if a second
 * app needs them.
 */

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

/** The current month (`YYYY-MM`) in the center's timezone. */
export function currentMonth(): string {
	return todayIsoDate().slice(0, 7);
}

/** Shift a `YYYY-MM` by whole months, wrapping the year. */
export function addMonths(month: string, delta: number): string {
	const [year, m] = month.split('-').map(Number);
	const index = year * 12 + (m - 1) + delta;
	const nextYear = Math.floor(index / 12);
	const nextMonth = (index % 12) + 1;
	return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}

/** A human month label, e.g. `2026-06` → "June 2026". */
export function formatMonthLabel(month: string): string {
	const [year, m] = month.split('-').map(Number);
	return `${MONTH_NAMES[m - 1] ?? month} ${year}`;
}

/** Whether an ISO date (`YYYY-MM-DD`) is today in the center's timezone. */
export function isTodayIso(date: string): boolean {
	return date === todayIsoDate();
}

/** Whether an ISO date (`YYYY-MM-DD`) is today or earlier — the editable window (D4). */
export function isPastOrTodayIso(date: string): boolean {
	return date <= todayIsoDate();
}
