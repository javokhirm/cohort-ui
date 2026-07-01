import type { StatusTone } from '@repo/ui';

import {
	SCHEDULE_DAYS,
	type EnrollmentStatus,
	type GroupStatus,
	type ScheduleDay,
	type ScheduleRule,
	type SessionStatus,
} from '../api/groups.queries';

// ─── Group status ─────────────────────────────────────────────────────────────
// The shared `lib/status.ts` map has no `group` kind, so tones/labels for group
// lifecycle are defined locally and passed to `<StatusBadge tone>` explicitly.

export const GROUP_STATUS_META: Record<GroupStatus, { tone: StatusTone; label: string }> =
	{
		PLANNED: { tone: 'slate', label: 'Planned' },
		ACTIVE: { tone: 'green', label: 'Active' },
		COMPLETED: { tone: 'blue', label: 'Completed' },
		CANCELLED: { tone: 'red', label: 'Cancelled' },
	};

/** Status filter chips for the list toolbar (maps to `?status=`). */
export const GROUP_STATUS_FILTERS: { value: GroupStatus | undefined; label: string }[] = [
	{ value: undefined, label: 'All' },
	{ value: 'PLANNED', label: 'Planned' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'COMPLETED', label: 'Completed' },
	{ value: 'CANCELLED', label: 'Cancelled' },
];

/** Status dropdown options for the edit form. */
export const GROUP_STATUS_OPTIONS = (Object.keys(GROUP_STATUS_META) as GroupStatus[]).map(
	(value) => ({ value, label: GROUP_STATUS_META[value].label }),
);

// ─── Enrollment status ──────────────────────────────────────────────────────

export const ENROLLMENT_STATUS_META: Record<EnrollmentStatus, string> = {
	ACTIVE: 'Active',
	DROPPED: 'Dropped',
	COMPLETED: 'Completed',
	TRANSFERRED: 'Transferred',
};

// ─── Session status ───────────────────────────────────────────────────────────

/** Session filter chips for the schedule calendar (maps to `?status=`). */
export const SESSION_STATUS_FILTERS: {
	value: SessionStatus | undefined;
	label: string;
}[] = [
	{ value: undefined, label: 'All' },
	{ value: 'SCHEDULED', label: 'Scheduled' },
	{ value: 'COMPLETED', label: 'Completed' },
	{ value: 'CANCELLED', label: 'Cancelled' },
];

// ─── Schedule days ──────────────────────────────────────────────────────────

export const DAY_LABELS: Record<ScheduleDay, string> = {
	MON: 'Mon',
	TUE: 'Tue',
	WED: 'Wed',
	THU: 'Thu',
	FRI: 'Fri',
	SAT: 'Sat',
	SUN: 'Sun',
};

/** JS `Date.getDay()` (0=Sun) → backend `ScheduleDay` code. */
const JS_DAY_TO_CODE: ScheduleDay[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function dayCodeFromDate(date: Date): ScheduleDay {
	return JS_DAY_TO_CODE[date.getDay()]!;
}

/** Order a set of day codes by the canonical Mon→Sun week order. */
export function sortDays(days: ScheduleDay[]): ScheduleDay[] {
	return SCHEDULE_DAYS.filter((d) => days.includes(d));
}

/** Trim a backend time (`HH:mm[:ss]`) down to `HH:mm` for display. */
export function hhmm(time: string): string {
	return time.slice(0, 5);
}

/**
 * Local `YYYY-MM-DD` for a JS Date. Built from local calendar parts (not
 * `toISOString`/tz-shifting helpers) so the day the user sees in the week strip
 * matches the day sent to the calendar API.
 */
export function toYmd(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** "Mon · Wed · Fri · 09:00–10:30" — a one-line schedule summary. */
export function formatScheduleRule(rule: ScheduleRule | null): string | null {
	if (!rule || rule.days.length === 0) return null;
	const days = sortDays(rule.days)
		.map((d) => DAY_LABELS[d])
		.join(' · ');
	return `${days} · ${hhmm(rule.startTime)}–${hhmm(rule.endTime)}`;
}
