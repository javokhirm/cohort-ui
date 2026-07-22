import { todayIsoDate } from '@repo/utils';

/**
 * `YYYY-MM` month helpers for the payroll period. Kept feature-local — the
 * teacher app carries the same helpers per feature and `@repo/utils` ships
 * week helpers but no month ones; promotion is the engineer's call.
 */

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

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

/** The current month (`YYYY-MM`) in the center's timezone (Asia/Tashkent). */
export function currentMonth(): string {
	return todayIsoDate().slice(0, 7);
}

/** Shift a `YYYY-MM` by whole months, wrapping the year. */
export function addMonths(month: string, delta: number): string {
	const [year, m] = month.split('-').map(Number);
	const index = (year ?? 0) * 12 + ((m ?? 1) - 1) + delta;
	const nextYear = Math.floor(index / 12);
	const nextMonth = (index % 12) + 1;
	return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}

/** A human month label, e.g. `2026-06` → "June 2026". */
export function formatMonthLabel(month: string): string {
	const [year, m] = month.split('-').map(Number);
	return `${MONTH_NAMES[(m ?? 1) - 1] ?? month} ${year}`;
}
