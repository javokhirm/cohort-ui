/**
 * Calendar arithmetic shared by the three schedule screens (weekly, monthly,
 * room availability).
 *
 * Everything here works in **local** calendar parts — never `toISOString` or a
 * UTC-shifting helper — so the day a user sees in the grid is the day sent to
 * the calendar API. See {@link toYmd} in `group-options`, which is the matching
 * serializer.
 */

/** `Date.getDay()` (0 = Sun) → the `groups` catalog `day.*` key. */
export const DOW_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** Month-grid headers, Monday-first, as `groups` catalog `day.*` keys. */
export const MONTH_HEADER_KEYS = [
	'MON',
	'TUE',
	'WED',
	'THU',
	'FRI',
	'SAT',
	'SUN',
] as const;

/** Monday 00:00 of the week containing `d`. */
export function startOfWeek(d: Date): Date {
	const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const day = date.getDay(); // 0=Sun … 6=Sat
	const diff = day === 0 ? -6 : 1 - day;
	date.setDate(date.getDate() + diff);
	return date;
}

export function addDays(d: Date, n: number): Date {
	const date = new Date(d);
	date.setDate(date.getDate() + n);
	return date;
}

export function startOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** The first of the month `delta` months from the one containing `d`. */
export function addMonths(d: Date, delta: number): Date {
	return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

/** Full Mon–Sun weeks spanning the month containing `monthAnchor`. */
export function monthGridRange(monthAnchor: Date): { start: Date; end: Date } {
	const start = startOfWeek(startOfMonth(monthAnchor));
	const end = addDays(startOfWeek(endOfMonth(monthAnchor)), 6);
	return { start, end };
}

/** A `?date=YYYY-MM-DD` search param as a local Date; today when absent or malformed. */
export function parseDate(value: string | undefined): Date {
	if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [y, m, day] = value.split('-').map(Number);
		return new Date(y!, m! - 1, day!);
	}
	return new Date();
}
