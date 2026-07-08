import { z } from 'zod';

import {
	GROUP_STATUSES,
	SCHEDULE_DAYS,
	type GroupDetail,
	type ScheduleDay,
	type ScheduleRule,
} from '../api/groups.queries';
import type { CreateGroupInput, UpdateGroupInput } from '../api/groups.mutations';

/** Optional teacher/room selects can't use an empty string (Radix reserves it). */
export const NONE_VALUE = 'none';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const optionalDate = z
	.string()
	.regex(DATE_RE, 'Use YYYY-MM-DD')
	.optional()
	.or(z.literal(''));

const capacity = z
	.number({ error: 'Enter a whole number' })
	.int('Enter a whole number')
	.min(1, 'Capacity must be at least 1')
	.optional();

const baseGroupSchema = z.object({
	name: z.string().min(1, 'Group name is required'),
	branchId: z.string().min(1, 'Branch is required'),
	courseId: z.string().min(1, 'Course is required'),
	teacherId: z.string(),
	roomId: z.string(),
	capacity,
	startDate: optionalDate,
	endDate: optionalDate,
	// Weekly schedule rule — always required; auto-generates sessions when a
	// date range is also set.
	days: z.array(z.enum(SCHEDULE_DAYS)),
	startTime: z.string(),
	endTime: z.string(),
});

/** Shared cross-field checks for the schedule rule + date range. */
function refineGroup(
	val: {
		days: ScheduleDay[];
		startTime: string;
		endTime: string;
		startDate?: string;
		endDate?: string;
	},
	ctx: z.RefinementCtx,
) {
	if (val.days.length === 0) {
		ctx.addIssue({
			code: 'custom',
			path: ['days'],
			message: 'Pick at least one day',
		});
	}
	if (!TIME_RE.test(val.startTime)) {
		ctx.addIssue({
			code: 'custom',
			path: ['startTime'],
			message: 'Use HH:mm (24h)',
		});
	}
	if (!TIME_RE.test(val.endTime)) {
		ctx.addIssue({
			code: 'custom',
			path: ['endTime'],
			message: 'Use HH:mm (24h)',
		});
	}
	if (
		TIME_RE.test(val.startTime) &&
		TIME_RE.test(val.endTime) &&
		val.endTime <= val.startTime
	) {
		ctx.addIssue({
			code: 'custom',
			path: ['endTime'],
			message: 'End time must be after start time',
		});
	}
	if (val.startDate && val.endDate && val.endDate < val.startDate) {
		ctx.addIssue({
			code: 'custom',
			path: ['endDate'],
			message: 'End date must be after start date',
		});
	}
}

export const createGroupSchema = baseGroupSchema.superRefine(refineGroup);

export const editGroupSchema = baseGroupSchema
	.extend({
		status: z.enum(GROUP_STATUSES),
		regenerateSessions: z.boolean(),
	})
	.superRefine(refineGroup);

export type CreateGroupFormValues = z.infer<typeof createGroupSchema>;
export type EditGroupFormValues = z.infer<typeof editGroupSchema>;

// ─── Conversions ─────────────────────────────────────────────────────────────

function selectToId(value: string): number | null {
	return value === NONE_VALUE || value === '' ? null : Number(value);
}

function toScheduleRule(v: CreateGroupFormValues): ScheduleRule {
	return { days: v.days, startTime: v.startTime, endTime: v.endTime };
}

export function createValuesToPayload(v: CreateGroupFormValues): CreateGroupInput {
	return {
		branchId: Number(v.branchId),
		courseId: Number(v.courseId),
		name: v.name.trim(),
		defaultTeacherId: selectToId(v.teacherId),
		roomId: selectToId(v.roomId),
		capacity: v.capacity ?? null,
		startDate: v.startDate || null,
		endDate: v.endDate || null,
		scheduleRule: toScheduleRule(v),
	};
}

export function editValuesToPayload(
	id: number,
	v: EditGroupFormValues,
): UpdateGroupInput {
	return {
		id,
		name: v.name.trim(),
		defaultTeacherId: selectToId(v.teacherId),
		roomId: selectToId(v.roomId),
		capacity: v.capacity ?? null,
		startDate: v.startDate || null,
		endDate: v.endDate || null,
		scheduleRule: toScheduleRule(v),
		status: v.status,
		regenerateSessions: v.regenerateSessions,
	};
}

/** Group detail → edit-form defaults. */
export function groupToFormValues(g: GroupDetail): EditGroupFormValues {
	return {
		name: g.name,
		branchId: String(g.branchId),
		courseId: String(g.courseId),
		teacherId: g.defaultTeacherId != null ? String(g.defaultTeacherId) : NONE_VALUE,
		roomId: g.roomId != null ? String(g.roomId) : NONE_VALUE,
		capacity: g.capacity ?? undefined,
		startDate: g.startDate ?? '',
		endDate: g.endDate ?? '',
		days: g.scheduleRule?.days ?? [],
		startTime: g.scheduleRule?.startTime ?? '09:00',
		endTime: g.scheduleRule?.endTime ?? '10:30',
		status: g.status,
		regenerateSessions: false,
	};
}
