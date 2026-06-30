import { DateTime } from 'luxon';

const ZONE = 'Asia/Tashkent';

function fromIso(iso: string): DateTime {
	return DateTime.fromISO(iso, { zone: ZONE });
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
	return DateTime.fromJSDate(date, { zone: ZONE }).toISODate() ?? '';
}

/** Whether the ISO timestamp is before now in Asia/Tashkent */
export function isExpired(iso: string): boolean {
	return fromIso(iso) < DateTime.now().setZone(ZONE);
}
