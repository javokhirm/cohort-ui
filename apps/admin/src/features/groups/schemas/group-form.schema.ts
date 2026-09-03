import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import {
	GROUP_STATUSES,
	SCHEDULE_DAYS,
	type GroupDetail,
	type ScheduleDay,
	type ScheduleRule,
} from '../api/groups.queries';
import { GRADING_CONFIG_TYPES } from '../api/grading-config.queries';
import type {
	CreateGroupInput,
	GradingConfigInput,
	UpdateGroupInput,
} from '../api/groups.mutations';
import type { GroupsT } from '../lib/group-options';

/** Optional teacher/room selects can't use an empty string (Radix reserves it). */
export const NONE_VALUE = 'none';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Schema factories — every message is user-facing, so it resolves at render
 * from the shared `validation` catalog plus the group-specific
 * `groups.form.validation.*` keys, never at module load (conventions.md §7).
 * Callers memoise on the translators.
 */
function baseGroupSchema(tv: Translator<'validation'>, t: GroupsT) {
	const optionalDate = z
		.string()
		.regex(DATE_RE, t('form.validation.dateFormat'))
		.optional()
		.or(z.literal(''));

	return z.object({
		name: z.string().min(1, tv('required')),
		branchId: z.string().min(1, tv('required')),
		courseId: z.string().min(1, tv('required')),
		teacherId: z.string(),
		roomId: z.string(),
		capacity: z
			.number({ error: tv('integerInvalid') })
			.int(tv('integerInvalid'))
			.min(1, t('form.validation.capacityMin'))
			.optional(),
		startDate: optionalDate,
		endDate: optionalDate,
		days: z.array(z.enum(SCHEDULE_DAYS)),
		startTime: z.string(),
		endTime: z.string(),
	});
}

/** Shared cross-field checks for the schedule rule + date range. */
function refineGroup(
	tv: Translator<'validation'>,
	t: GroupsT,
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
			message: t('form.validation.pickDay'),
		});
	}
	if (!TIME_RE.test(val.startTime)) {
		ctx.addIssue({
			code: 'custom',
			path: ['startTime'],
			message: t('form.validation.timeFormat'),
		});
	}
	if (!TIME_RE.test(val.endTime)) {
		ctx.addIssue({
			code: 'custom',
			path: ['endTime'],
			message: t('form.validation.timeFormat'),
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
			message: tv('timeRangeInvalid'),
		});
	}
	if (val.startDate && val.endDate && val.endDate < val.startDate) {
		ctx.addIssue({
			code: 'custom',
			path: ['endDate'],
			message: tv('dateRangeInvalid'),
		});
	}
}

export function createGroupSchema(tv: Translator<'validation'>, t: GroupsT) {
	return baseGroupSchema(tv, t)
		.extend({
			gradingType: z.enum(GRADING_CONFIG_TYPES),
			gradingMaxPoints: z.string(),
			gradingAllowHalf: z.boolean(),
		})
		.superRefine((val, ctx) => {
			refineGroup(tv, t, val, ctx);
			if (val.gradingType !== 'LETTER' && !(Number(val.gradingMaxPoints) > 0)) {
				ctx.addIssue({
					code: 'custom',
					path: ['gradingMaxPoints'],
					message: t('form.validation.gradingMax'),
				});
			}
		});
}

export function editGroupSchema(tv: Translator<'validation'>, t: GroupsT) {
	return baseGroupSchema(tv, t)
		.extend({
			status: z.enum(GROUP_STATUSES),
			regenerateSessions: z.boolean(),
		})
		.superRefine((val, ctx) => refineGroup(tv, t, val, ctx));
}

export type CreateGroupFormValues = z.infer<ReturnType<typeof createGroupSchema>>;
export type EditGroupFormValues = z.infer<ReturnType<typeof editGroupSchema>>;

// ─── Conversions ─────────────────────────────────────────────────────────────

function selectToId(value: string): number | null {
	return value === NONE_VALUE || value === '' ? null : Number(value);
}

function toScheduleRule(v: {
	days: ScheduleDay[];
	startTime: string;
	endTime: string;
}): ScheduleRule {
	return { days: v.days, startTime: v.startTime, endTime: v.endTime };
}

/** Create-form grading fields → the `gradingConfig` payload (LETTER drops the max). */
function toGradingConfig(v: CreateGroupFormValues): GradingConfigInput {
	if (v.gradingType === 'LETTER') return { type: 'LETTER' };
	return {
		type: v.gradingType,
		maxPoints: Number(v.gradingMaxPoints),
		...(v.gradingType === 'POINTS' ? { allowHalf: v.gradingAllowHalf } : {}),
	};
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
		gradingConfig: toGradingConfig(v),
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
