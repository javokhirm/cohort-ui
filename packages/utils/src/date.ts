import { DateTime } from 'luxon';

export const TASHKENT_TZ = 'Asia/Tashkent';

function fromIso(iso: string): DateTime {
	return DateTime.fromISO(iso, { zone: TASHKENT_TZ });
}

/** "15 Jun 2024" — date-only columns, subscription periods, member activity */
export function formatDate(iso: string): string {
	return fromIso(iso).toFormat('dd MMM yyyy');
}

/** "15 Jun 2024, 14:30" — table timestamps, compact date+time */
export function formatDateTime(iso: string): string {
	return fromIso(iso).toFormat('dd MMM yyyy, HH:mm');
}

/** "15 June 2024, 14:30:05" — detail views, audit log entry */
export function formatDateTimeLong(iso: string): string {
	return fromIso(iso).toFormat('dd MMMM yyyy, HH:mm:ss');
}

/** "2 hours ago" / "in 3 days" — relative time for feeds and activity */
export function formatRelative(iso: string): string {
	return fromIso(iso).toRelative({ locale: 'en' }) ?? formatDateTime(iso);
}

/** "YYYY-MM-DD" — convert a JS Date (e.g. from a date-picker) to an API date string */
export function toIsoDate(date: Date): string {
	return DateTime.fromJSDate(date, { zone: TASHKENT_TZ }).toISODate() ?? '';
}

/** Whether the ISO timestamp is before now in Asia/Tashkent */
export function isExpired(iso: string): boolean {
	return fromIso(iso) < DateTime.now().setZone(TASHKENT_TZ);
}

/**
 * Format a date string as "Mon, 1 Jun"
 */
export function formatShortDate(iso: string): string {
	return fromIso(iso).toFormat('EEE, d MMM');
}

/**
 * "09:00" from a `HH:mm` or `HH:mm:ss` time-of-day string (the backend's `time`
 * columns serialize with seconds). Drops the seconds; leaves already-short
 * values untouched.
 */
export function formatTime(time: string): string {
	return time.slice(0, 5);
}

/** Today's calendar date in the center's timezone, as `YYYY-MM-DD`. */
export function todayIsoDate(): string {
	return DateTime.now().setZone(TASHKENT_TZ).toISODate() ?? '';
}

/** The current hour (0–23) in the center's timezone. */
export function currentHour(): number {
	return DateTime.now().setZone(TASHKENT_TZ).hour;
}

/** Shift a `YYYY-MM-DD` date by whole days (may cross months/years). */
export function addDays(iso: string, days: number): string {
	return fromIso(iso).plus({ days }).toISODate() ?? iso;
}

/** Monday (week start) of the week containing `iso`, as `YYYY-MM-DD`. */
export function startOfWeek(iso: string): string {
	return fromIso(iso).startOf('week').toISODate() ?? iso;
}

/** Sunday (week end) of the week containing `iso`, as `YYYY-MM-DD`. */
export function endOfWeek(iso: string): string {
	return fromIso(iso).endOf('week').toISODate() ?? iso;
}

/** The seven Monday→Sunday dates of the week containing `iso`. */
export function weekDates(iso: string): string[] {
	const monday = fromIso(startOfWeek(iso));
	return Array.from(
		{ length: 7 },
		(_, i) => monday.plus({ days: i }).toISODate() ?? '',
	);
}

/** Short weekday for a date, e.g. `Mon`. */
export function formatWeekday(iso: string): string {
	return fromIso(iso).toFormat('EEE');
}

/** Day-of-month number for a date, e.g. `15`. */
export function formatDayOfMonth(iso: string): string {
	return fromIso(iso).toFormat('d');
}

/** Full header date, e.g. `Monday, 15 July`. */
export function formatFullDate(iso: string): string {
	return fromIso(iso).toFormat('EEEE, d MMMM');
}

/** Week-range label, e.g. `14 – 20 Jul`, or `28 Jul – 3 Aug` across months. */
export function formatWeekRange(iso: string): string {
	const start = fromIso(startOfWeek(iso));
	const end = fromIso(endOfWeek(iso));
	const endLabel = end.toFormat('d MMM');
	return start.month === end.month
		? `${start.toFormat('d')} – ${endLabel}`
		: `${start.toFormat('d MMM')} – ${endLabel}`;
}
