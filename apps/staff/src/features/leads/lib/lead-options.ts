import type { StatusTone } from '@repo/ui';

import type {
	LeadActivityType,
	LeadLoggableActivityType,
	LeadSource,
	LeadStatus,
} from '../api/leads.queries';

/** Lead-source options for the create form and the source filter. */
export const LEAD_SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
	{ value: 'INSTAGRAM', label: 'Instagram' },
	{ value: 'TELEGRAM', label: 'Telegram' },
	{ value: 'REFERRAL', label: 'Referral' },
	{ value: 'WALK_IN', label: 'Walk-in' },
	{ value: 'WEBSITE', label: 'Website' },
	{ value: 'OTHER', label: 'Other' },
];

export function leadSourceLabel(source: LeadSource): string {
	return LEAD_SOURCE_OPTIONS.find((o) => o.value === source)?.label ?? source;
}

/** The four client-loggable activity types (the detail sheet's chip toggle). */
export const ACTIVITY_TYPE_OPTIONS: {
	value: LeadLoggableActivityType;
	label: string;
}[] = [
	{ value: 'CALL', label: 'Call' },
	{ value: 'MESSAGE', label: 'Message' },
	{ value: 'TRIAL', label: 'Trial' },
	{ value: 'NOTE', label: 'Note' },
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

export const TIME_WINDOW_OPTIONS: {
	value: TimeWindow;
	label: string;
	hours: number;
}[] = [
	{ value: '24h', label: 'Last 24 hours', hours: 24 },
	{ value: '7d', label: 'Last 7 days', hours: 24 * 7 },
	{ value: '30d', label: 'Last 30 days', hours: 24 * 30 },
	{ value: '90d', label: 'Last 90 days', hours: 24 * 90 },
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
