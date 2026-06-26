/**
 * Semantic status "tones" and the domain status → tone/label maps.
 *
 * The prototypes drive every status pill from a single `badge(kind, status)`
 * table; this is the React-side equivalent. The mappings mirror the EduCore
 * domain documented in the backend `project-overview.md` (invoice/payment/lead/
 * session/attendance lifecycles, etc.). They are presentation metadata only —
 * when the generated OpenAPI enums land, reconcile the keys here against them.
 */

export const STATUS_TONES = [
	'green',
	'red',
	'amber',
	'blue',
	'violet',
	'slate',
	'indigo',
	'cyan',
	'pink',
	'orange',
	'yellow',
] as const;

export type StatusTone = (typeof STATUS_TONES)[number];

/**
 * Tailwind class pairs per tone. The literal strings here are scanned by
 * Tailwind (see `@source` in globals.css) so the utilities are generated.
 */
export const TONE_CLASSES: Record<StatusTone, string> = {
	green: 'bg-tone-green-bg text-tone-green-fg',
	red: 'bg-tone-red-bg text-tone-red-fg',
	amber: 'bg-tone-amber-bg text-tone-amber-fg',
	blue: 'bg-tone-blue-bg text-tone-blue-fg',
	violet: 'bg-tone-violet-bg text-tone-violet-fg',
	slate: 'bg-tone-slate-bg text-tone-slate-fg',
	indigo: 'bg-tone-indigo-bg text-tone-indigo-fg',
	cyan: 'bg-tone-cyan-bg text-tone-cyan-fg',
	pink: 'bg-tone-pink-bg text-tone-pink-fg',
	orange: 'bg-tone-orange-bg text-tone-orange-fg',
	yellow: 'bg-tone-yellow-bg text-tone-yellow-fg',
};

export interface StatusDescriptor {
	tone: StatusTone;
	label: string;
}

type StatusMap = Record<string, StatusDescriptor>;

/** Domain status maps. Keys are normalized (lowercase, `_`-joined). */
export const STATUS_MAPS = {
	invoice: {
		draft: { tone: 'slate', label: 'Draft' },
		unpaid: { tone: 'slate', label: 'Unpaid' },
		partial: { tone: 'amber', label: 'Partial' },
		paid: { tone: 'green', label: 'Paid' },
		overdue: { tone: 'red', label: 'Overdue' },
		void: { tone: 'slate', label: 'Void' },
		refunded: { tone: 'violet', label: 'Refunded' },
	},
	payment: {
		success: { tone: 'green', label: 'Success' },
		completed: { tone: 'green', label: 'Completed' },
		pending: { tone: 'amber', label: 'Pending' },
		failed: { tone: 'red', label: 'Failed' },
	},
	session: {
		scheduled: { tone: 'blue', label: 'Scheduled' },
		completed: { tone: 'green', label: 'Completed' },
		cancelled: { tone: 'red', label: 'Cancelled' },
		rescheduled: { tone: 'amber', label: 'Rescheduled' },
		substitute: { tone: 'violet', label: 'Substitute' },
	},
	attendance: {
		present: { tone: 'green', label: 'Present' },
		absent: { tone: 'red', label: 'Absent' },
		late: { tone: 'amber', label: 'Late' },
		excused: { tone: 'slate', label: 'Excused' },
	},
	student: {
		active: { tone: 'green', label: 'Active' },
		inactive: { tone: 'slate', label: 'Inactive' },
		graduated: { tone: 'blue', label: 'Graduated' },
		suspended: { tone: 'red', label: 'Suspended' },
	},
	enrollment: {
		active: { tone: 'green', label: 'Active' },
		dropped: { tone: 'red', label: 'Dropped' },
		completed: { tone: 'blue', label: 'Completed' },
		transferred: { tone: 'amber', label: 'Transferred' },
	},
	staff: {
		active: { tone: 'green', label: 'Active' },
		on_leave: { tone: 'amber', label: 'On leave' },
		inactive: { tone: 'slate', label: 'Inactive' },
	},
	lead: {
		new: { tone: 'slate', label: 'New' },
		contacted: { tone: 'blue', label: 'Contacted' },
		trial_booked: { tone: 'amber', label: 'Trial booked' },
		enrolled: { tone: 'green', label: 'Enrolled' },
		lost: { tone: 'red', label: 'Lost' },
	},
	lead_source: {
		instagram: { tone: 'pink', label: 'Instagram' },
		telegram: { tone: 'cyan', label: 'Telegram' },
		referral: { tone: 'green', label: 'Referral' },
		walk_in: { tone: 'amber', label: 'Walk-in' },
		website: { tone: 'indigo', label: 'Website' },
		other: { tone: 'slate', label: 'Other' },
	},
	assessment: {
		quiz: { tone: 'blue', label: 'Quiz' },
		midterm: { tone: 'amber', label: 'Midterm' },
		final: { tone: 'red', label: 'Final' },
		mock: { tone: 'violet', label: 'Mock' },
		homework: { tone: 'green', label: 'Homework' },
	},
	report_card: {
		draft: { tone: 'slate', label: 'Draft' },
		published: { tone: 'green', label: 'Published' },
	},
	payroll: {
		draft: { tone: 'slate', label: 'Draft' },
		approved: { tone: 'blue', label: 'Approved' },
		paid: { tone: 'green', label: 'Paid' },
	},
	notification: {
		queued: { tone: 'amber', label: 'Queued' },
		sent: { tone: 'blue', label: 'Sent' },
		delivered: { tone: 'green', label: 'Delivered' },
		failed: { tone: 'red', label: 'Failed' },
	},
	notification_type: {
		payment: { tone: 'amber', label: 'Payment' },
		grade: { tone: 'green', label: 'Grade' },
		schedule: { tone: 'blue', label: 'Schedule' },
		absence: { tone: 'red', label: 'Absence' },
		broadcast: { tone: 'indigo', label: 'Notice' },
	},
	material: {
		pdf: { tone: 'red', label: 'PDF' },
		video: { tone: 'violet', label: 'Video' },
		homework: { tone: 'green', label: 'Homework' },
		link: { tone: 'blue', label: 'Link' },
	},
	visibility: {
		group: { tone: 'indigo', label: 'Group' },
		branch: { tone: 'cyan', label: 'Branch' },
		tenant: { tone: 'yellow', label: 'Tenant' },
	},
	room: {
		classroom: { tone: 'indigo', label: 'Classroom' },
		lab: { tone: 'amber', label: 'Lab' },
		online: { tone: 'green', label: 'Online' },
	},
	channel: {
		sms: { tone: 'blue', label: 'SMS' },
		telegram: { tone: 'cyan', label: 'Telegram' },
		email: { tone: 'violet', label: 'Email' },
		push: { tone: 'green', label: 'Push' },
	},
	fee_cycle: {
		monthly: { tone: 'indigo', label: 'Monthly' },
		quarterly: { tone: 'blue', label: 'Quarterly' },
		one_time: { tone: 'slate', label: 'One-time' },
		per_session: { tone: 'amber', label: 'Per session' },
	},
	role: {
		owner: { tone: 'yellow', label: 'Owner' },
		admin: { tone: 'cyan', label: 'Admin' },
		manager: { tone: 'violet', label: 'Manager' },
		teacher: { tone: 'indigo', label: 'Teacher' },
		student: { tone: 'slate', label: 'Student' },
		parent: { tone: 'slate', label: 'Parent' },
	},
	tenant: {
		active: { tone: 'green', label: 'Active' },
		trialing: { tone: 'blue', label: 'Trialing' },
		past_due: { tone: 'amber', label: 'Past due' },
		suspended: { tone: 'red', label: 'Suspended' },
		cancelled: { tone: 'slate', label: 'Cancelled' },
	},
	system: {
		healthy: { tone: 'green', label: 'Healthy' },
		degraded: { tone: 'amber', label: 'Degraded' },
		down: { tone: 'red', label: 'Down' },
	},
} satisfies Record<string, StatusMap>;

export type StatusKind = keyof typeof STATUS_MAPS;

function normalize(status: string): string {
	return status
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, '_');
}

function toTitle(status: string): string {
	const clean = status.trim().replace(/[_-]+/g, ' ');
	return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

/**
 * Resolve a domain status to its tone + display label. Unknown statuses fall
 * back to the neutral `slate` tone with a title-cased label, so a missing or
 * newly-added backend status degrades gracefully instead of throwing.
 */
export function resolveStatus(kind: StatusKind, status: string): StatusDescriptor {
	const map = STATUS_MAPS[kind] as StatusMap;
	const entry = map[normalize(status)];
	return entry ?? { tone: 'slate', label: toTitle(status) };
}
