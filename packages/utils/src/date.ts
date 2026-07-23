import { TZDate } from '@date-fns/tz';
import {
	addDays as addDaysFn,
	endOfWeek as endOfWeekFn,
	format,
	formatDistanceToNowStrict,
	startOfWeek as startOfWeekFn,
	type Locale as DateFnsLocale,
} from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { ru } from 'date-fns/locale/ru';
import { uz } from 'date-fns/locale/uz';

import type { Locale } from './types';

export const TASHKENT_TZ = 'Asia/Tashkent';

/**
 * Our UI locale codes → date-fns' bundled locale objects.
 *
 * date-fns ships its month/weekday/relative-time data compiled into the bundle
 * (from CLDR), so localized names are identical on every runtime — unlike the
 * `Intl`/ICU path, whose `uz` data is unreliable across engines. That reliability
 * is the whole reason this module runs on date-fns: `uz`, `ru`, and `en` all read
 * from these objects, so there is no per-locale special-casing anywhere below.
 */
const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = {
	uz,
	ru,
	en: enUS,
};

/** Monday-first weeks, matching the center's calendar (ISO week). */
const WEEK_OPTS = { weekStartsOn: 1 } as const;

let currentLocale: DateFnsLocale = enUS;

/**
 * Point the date helpers at the active UI language, so localized month, weekday,
 * and relative-time output follows the switcher.
 *
 * `@repo/utils` sits below `@repo/i18n` in the dependency graph and must not
 * import it, so the locale is *pushed in* here: `@repo/i18n`'s `applyLocale`
 * calls this on boot and on every language change.
 */
export function setDateLocale(locale: Locale): void {
	currentLocale = DATE_FNS_LOCALES[locale];
}

/** Parse an ISO instant and render it in the center's timezone. */
function fromIso(iso: string): TZDate {
	return new TZDate(iso, TASHKENT_TZ);
}

/** Format for display in the active UI locale (localized names). */
function display(date: Date, pattern: string): string {
	return format(date, pattern, { locale: currentLocale });
}

/** Machine `YYYY-MM-DD`, locale-independent — for API/query date strings. */
function isoDate(date: Date): string {
	return format(date, 'yyyy-MM-dd');
}

/** "15 Jun 2024" — date-only columns, subscription periods, member activity */
export function formatDate(iso: string): string {
	return display(fromIso(iso), 'dd MMM yyyy');
}

/** "15 Jun 2024, 14:30" — table timestamps, compact date+time */
export function formatDateTime(iso: string): string {
	return display(fromIso(iso), 'dd MMM yyyy, HH:mm');
}

/** "15 June 2024, 14:30:05" — detail views, audit log entry */
export function formatDateTimeLong(iso: string): string {
	return display(fromIso(iso), 'dd MMMM yyyy, HH:mm:ss');
}

/** "2 hours ago" / "in 3 days" — relative time for feeds and activity */
export function formatRelative(iso: string): string {
	return formatDistanceToNowStrict(fromIso(iso), {
		locale: currentLocale,
		addSuffix: true,
	});
}

/** "YYYY-MM-DD" — convert a JS Date (e.g. from a date-picker) to an API date string */
export function toIsoDate(date: Date): string {
	return isoDate(new TZDate(date.getTime(), TASHKENT_TZ));
}

/** Whether the ISO timestamp is before now in Asia/Tashkent */
export function isExpired(iso: string): boolean {
	return fromIso(iso).getTime() < Date.now();
}

/**
 * Format a date string as "Mon, 1 Jun"
 */
export function formatShortDate(iso: string): string {
	return display(fromIso(iso), 'EEE, d MMM');
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
	return isoDate(new TZDate(Date.now(), TASHKENT_TZ));
}

/** The current hour (0–23) in the center's timezone. */
export function currentHour(): number {
	return new TZDate(Date.now(), TASHKENT_TZ).getHours();
}

/** Shift a `YYYY-MM-DD` date by whole days (may cross months/years). */
export function addDays(iso: string, days: number): string {
	return isoDate(addDaysFn(fromIso(iso), days));
}

/** Monday (week start) of the week containing `iso`, as `YYYY-MM-DD`. */
export function startOfWeek(iso: string): string {
	return isoDate(startOfWeekFn(fromIso(iso), WEEK_OPTS));
}

/** Sunday (week end) of the week containing `iso`, as `YYYY-MM-DD`. */
export function endOfWeek(iso: string): string {
	return isoDate(endOfWeekFn(fromIso(iso), WEEK_OPTS));
}

/** The seven Monday→Sunday dates of the week containing `iso`. */
export function weekDates(iso: string): string[] {
	const monday = startOfWeekFn(fromIso(iso), WEEK_OPTS);
	return Array.from({ length: 7 }, (_, i) => isoDate(addDaysFn(monday, i)));
}

/** Short weekday for a date, e.g. `Mon`. */
export function formatWeekday(iso: string): string {
	return display(fromIso(iso), 'EEE');
}

/** Day-of-month number for a date, e.g. `15`. */
export function formatDayOfMonth(iso: string): string {
	return display(fromIso(iso), 'd');
}

/** `YYYY-MM` → localized short month, e.g. `Jul` — chart axes, period labels. */
export function formatMonthShort(month: string): string {
	return display(fromIso(`${month}-01`), 'MMM');
}

/** Full header date, e.g. `Monday, 15 July` — add the year with `{ year: true }`. */
export function formatFullDate(iso: string, opts?: { year?: boolean }): string {
	return display(fromIso(iso), opts?.year ? 'EEEE, d MMMM yyyy' : 'EEEE, d MMMM');
}

/** Week-range label, e.g. `14 – 20 Jul`, or `28 Jul – 3 Aug` across months. */
export function formatWeekRange(iso: string): string {
	const start = startOfWeekFn(fromIso(iso), WEEK_OPTS);
	const end = endOfWeekFn(fromIso(iso), WEEK_OPTS);
	const endLabel = display(end, 'd MMM');
	return start.getMonth() === end.getMonth()
		? `${display(start, 'd')} – ${endLabel}`
		: `${display(start, 'd MMM')} – ${endLabel}`;
}
