import type { StatusTone } from '@repo/ui';

import type {
	LeadActivityType,
	LeadLoggableActivityType,
	LeadSource,
	LeadStatus,
} from '../api/leads.queries';

/**
 * Lead option tables — **values and keys only, never display text**.
 *
 * A label captured at module load would freeze in whatever language was active
 * when the module first evaluated (conventions.md §7). Sources and statuses are
 * resolved at render through `useStatusLabel`, which reads the same
 * `enums.domain.lead*` catalog that colors the badges; activity types and time
 * windows resolve against the app's `leads` namespace.
 */

/** Lead-source options for the create form and the source filter. */
export const LEAD_SOURCE_OPTIONS: { value: LeadSource }[] = [
	{ value: 'INSTAGRAM' },
	{ value: 'TELEGRAM' },
	{ value: 'REFERRAL' },
	{ value: 'WALK_IN' },
	{ value: 'WEBSITE' },
	{ value: 'OTHER' },
];

/** The four client-loggable activity types (the detail sheet's chip toggle). */
export const ACTIVITY_TYPE_OPTIONS: { value: LeadLoggableActivityType }[] = [
	{ value: 'CALL' },
	{ value: 'MESSAGE' },
	{ value: 'TRIAL' },
	{ value: 'NOTE' },
];

/** Tone per activity type for the timeline dots. */
export const ACTIVITY_TONE: Record<LeadActivityType, StatusTone> = {
	CALL: 'blue',
	MESSAGE: 'cyan',
	TRIAL: 'amber',
	NOTE: 'slate',
	STATUS_CHANGE: 'violet',
	CONVERT: 'green',
};

// ─── Time window filter ──────────────────────────────────────────────────────
// The `createdAfter` cutoff is a moving timestamp, so the URL carries a stable
// window token and the ISO value is derived at query-build time.

export const TIME_WINDOW_VALUES = ['24h', '7d', '30d', '90d'] as const;
export type TimeWindow = (typeof TIME_WINDOW_VALUES)[number];

export const TIME_WINDOW_OPTIONS: { value: TimeWindow; hours: number }[] = [
	{ value: '24h', hours: 24 },
	{ value: '7d', hours: 24 * 7 },
	{ value: '30d', hours: 24 * 30 },
	{ value: '90d', hours: 24 * 90 },
];

/** Resolve a window token to an ISO `createdAfter` cutoff (evaluated now). */
export function windowToCreatedAfter(window: TimeWindow | undefined): string | undefined {
	const opt = TIME_WINDOW_OPTIONS.find((o) => o.value === window);
	if (!opt) return undefined;
	return new Date(Date.now() - opt.hours * 60 * 60 * 1000).toISOString();
}

// ─── Pipeline transitions ────────────────────────────────────────────────────
// Mirrors the backend `LEAD_TRANSITIONS` for drag-and-drop UX gating only — the
// server remains the authority (an illegal move still 400s and is surfaced).

const OPEN_STAGES: LeadStatus[] = ['NEW', 'CONTACTED', 'TRIAL_BOOKED'];

/** Whether a card may be dragged from `from` and dropped onto `to`. */
export function canMoveLead(from: LeadStatus, to: LeadStatus): boolean {
	if (from === to) return false;
	// ENROLLED is reachable only via convert; ENROLLED/LOST are terminal.
	if (to === 'ENROLLED') return false;
	if (!OPEN_STAGES.includes(from)) return false;
	return OPEN_STAGES.includes(to) || to === 'LOST';
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export function getInitials(firstName: string, lastName?: string | null): string {
	return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function leadFullName(firstName: string, lastName?: string | null): string {
	return lastName ? `${firstName} ${lastName}` : firstName;
}
