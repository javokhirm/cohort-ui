import type { StatusTone } from '@repo/ui';

import type { useAppT } from '@/locales';

import {
	SCHEDULE_DAYS,
	type EnrollmentStatus,
	type GroupStatus,
	type ScheduleDay,
	type ScheduleRule,
	type SessionStatus,
} from '../api/groups.queries';
import { GRADING_CONFIG_TYPES, type GradingType } from '../api/grading-config.queries';

/**
 * Every table below holds **values, tones and keys — never display text**. A
 * label captured at module load would freeze in whatever language was active
 * when the module first evaluated (conventions.md §7); screens resolve the
 * matching `groups.*` key at render instead.
 */
export type GroupsT = ReturnType<typeof useAppT<'groups'>>;

// ─── Group status ─────────────────────────────────────────────────────────────
// The shared `lib/status.ts` map has no `group` kind, so the tone for a group's
// lifecycle is defined locally and passed to `<StatusBadge tone>` explicitly;
// the words come from `groups.status.*`.

export const GROUP_STATUS_TONES: Record<GroupStatus, StatusTone> = {
	PLANNED: 'slate',
	ACTIVE: 'green',
	COMPLETED: 'blue',
	CANCELLED: 'red',
};

/** Status filter chips for the list toolbar (maps to `?status=`). */
export const GROUP_STATUS_FILTERS: { value: GroupStatus | undefined }[] = [
	{ value: undefined },
	{ value: 'PLANNED' },
	{ value: 'ACTIVE' },
	{ value: 'COMPLETED' },
	{ value: 'CANCELLED' },
];

/** Status dropdown options for the edit form. */
export const GROUP_STATUS_OPTIONS = (
	Object.keys(GROUP_STATUS_TONES) as GroupStatus[]
).map((value) => ({ value }));

// ─── Grading scale ────────────────────────────────────────────────────────────

/** Segmented scale-type options for the grading control. */
export const GRADING_TYPE_OPTIONS = GRADING_CONFIG_TYPES.map((value) => ({ value }));

/** A short label for a grading scale, e.g. "Points · max 10" / "Letter · A–F". */
export function formatGradingScale(
	t: GroupsT,
	config: { type: GradingType; maxPoints: number | null },
): string {
	switch (config.type) {
		case 'POINTS':
			return t('grading.summary.points', { max: config.maxPoints ?? '—' });
		case 'PERCENTAGE':
			return t('grading.summary.percentage', { max: config.maxPoints ?? 100 });
		case 'LETTER':
			return t('grading.summary.letter');
	}
}

/** Preview label for the pending form values (max is still a raw string). */
export function gradingPreview(
	t: GroupsT,
	type: GradingType,
	maxPoints: string,
): string {
	switch (type) {
		case 'POINTS':
			return t('grading.summary.dailyPoints', { max: maxPoints || '—' });
		case 'PERCENTAGE':
			return t('grading.summary.percentage', { max: maxPoints || '100' });
		case 'LETTER':
			return t('grading.summary.letter');
	}
}

// ─── Enrollment status ──────────────────────────────────────────────────────

export const ENROLLMENT_STATUSES: EnrollmentStatus[] = [
	'ACTIVE',
	'SUSPENDED',
	'DROPPED',
	'COMPLETED',
	'TRANSFERRED',
];

/** Status filter chips for a roster/enrollments list (maps to `?status=`). */
export const ENROLLMENT_STATUS_FILTERS: { value: EnrollmentStatus | undefined }[] = [
	{ value: undefined },
	...ENROLLMENT_STATUSES.map((value) => ({ value })),
];

/**
 * Server-enforced transitions for `PATCH /manage/enrollments/:id` (400 on a
 * violation) — mirrored here so invalid actions are disabled client-side
 * rather than surfacing a raw error. Terminal statuses have no way out.
 */
export const ENROLLMENT_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
	ACTIVE: ['SUSPENDED', 'DROPPED', 'COMPLETED', 'TRANSFERRED'],
	SUSPENDED: ['ACTIVE', 'DROPPED'],
	DROPPED: [],
	COMPLETED: [],
	TRANSFERRED: [],
};

export function canTransitionEnrollment(
	from: EnrollmentStatus,
	to: EnrollmentStatus,
): boolean {
	return ENROLLMENT_TRANSITIONS[from].includes(to);
}

// ─── Session status ───────────────────────────────────────────────────────────

/** Session filter chips for the schedule calendar (maps to `?status=`). */
export const SESSION_STATUS_FILTERS: { value: SessionStatus | undefined }[] = [
	{ value: undefined },
	{ value: 'SCHEDULED' },
	{ value: 'COMPLETED' },
	{ value: 'CANCELLED' },
];

// ─── Schedule days ──────────────────────────────────────────────────────────

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

/** "1h 30m" — a session's duration, computed from its start/end time. */
export function formatSessionDuration(
	t: GroupsT,
	startTime: string,
	endTime: string,
): string {
	const [sh = 0, sm = 0] = hhmm(startTime).split(':').map(Number);
	const [eh = 0, em = 0] = hhmm(endTime).split(':').map(Number);
	const mins = eh * 60 + em - (sh * 60 + sm);
	if (mins <= 0) return '—';
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	if (h === 0) return t('duration.minutes', { minutes: m });
	return m === 0
		? t('duration.hours', { hours: h })
		: t('duration.hoursMinutes', { hours: h, minutes: m });
}

/**
 * Local `YYYY-MM-DD` for a JS Date. Built from local calendar parts (not
 * `toISOString`/tz-shifting helpers) so the day the user sees in the calendar
 * matches the day sent to the calendar API.
 */
export function toYmd(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** "Mon · Wed · Fri · 09:00–10:30" — a one-line schedule summary. */
export function formatScheduleRule(
	t: GroupsT,
	rule: ScheduleRule | null,
): string | null {
	if (!rule || rule.days.length === 0) return null;
	const days = sortDays(rule.days)
		.map((d) => t(`day.${d}`))
		.join(' · ');
	return `${days} · ${hhmm(rule.startTime)}–${hhmm(rule.endTime)}`;
}
