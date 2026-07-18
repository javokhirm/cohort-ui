import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

export type GroupStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface TeachScheduleRule {
	days: string[];
	startTime: string;
	endTime: string;
}

/**
 * A group the teacher teaches (`GET /teach/groups`, api-reference §4.2).
 *
 * Hand-mirrored from the backend's `TeachGroupListItemDto` — the teach
 * controllers declare no `@ApiOkResponse`, so there is no response schema in the
 * OpenAPI document to generate from.
 */
export interface TeachGroup {
	id: number;
	branchId: number;
	courseId: number;
	courseName: string;
	defaultTeacherId: number | null;
	defaultTeacherName: string | null;
	roomId: number | null;
	roomName: string | null;
	name: string;
	capacity: number | null;
	startDate: string | null;
	endDate: string | null;
	scheduleRule: TeachScheduleRule | null;
	status: GroupStatus;
	/** Students currently enrolled (ACTIVE). Shown against `capacity`. */
	activeEnrollmentsCount: number;
	/**
	 * Whole-group attendance %, or `null` when nothing has been marked yet.
	 * `null` is "no data" — render it as absent, never as 0%.
	 */
	attendanceRate: number | null;
}

/**
 * One group in detail (`GET /teach/groups/:id`) — every list field plus the
 * session count. The endpoint used to embed the roster too; the roster now has
 * its own endpoint (`useGroupStudents`), which also carries each student's
 * attendance rate.
 */
export interface TeachGroupDetail extends TeachGroup {
	sessionCount: number;
	createdAt: string;
	updatedAt: string;
}

export type EnrollmentStatus =
	| 'ACTIVE'
	| 'SUSPENDED'
	| 'DROPPED'
	| 'COMPLETED'
	| 'TRANSFERRED';

/**
 * A roster entry from `GET /teach/groups/:id/students` — the enriched roster,
 * carrying contact details and the student's attendance rate *within this
 * group*. Hand-mirrored from `TeachGroupStudentDto`.
 */
export interface TeachGroupStudent {
	studentId: number;
	studentCode: string;
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	email: string | null;
	avatarUrl: string | null;
	enrolledAt: string;
	enrollmentStatus: EnrollmentStatus;
	/** `null` means nothing has been marked yet — render it as absent, never 0%. */
	attendanceRate: number | null;
}

export interface GroupListFilters {
	page?: number;
	limit?: number;
	status?: GroupStatus;
}

export const groupsKeys = {
	all: ['groups'] as const,
	list: (filters: GroupListFilters) => [...groupsKeys.all, 'list', filters] as const,
	detail: (groupId: number) => [...groupsKeys.all, 'detail', groupId] as const,
	students: (groupId: number) => [...groupsKeys.all, 'students', groupId] as const,
};

/**
 * The groups this teacher teaches.
 *
 * As with sessions, the active branch is **not** in the key — `/teach/groups`
 * takes no branch param, so it is filtered client-side (`useBranchFilter`).
 */
export function useGroups(filters: GroupListFilters = {}) {
	return useQuery({
		queryKey: groupsKeys.list(filters),
		queryFn: () => teachApi.getPaginated<TeachGroup>('/groups', { params: filters }),
		placeholderData: keepPreviousData,
	});
}

/**
 * One group's detail — the header of the group screen.
 *
 * `enabled` guards the route param: it arrives as a string and `Number('')` is
 * `0`, which would fetch `/groups/0`.
 */
export function useGroup(groupId: number) {
	return useQuery({
		queryKey: groupsKeys.detail(groupId),
		queryFn: () => teachApi.get<TeachGroupDetail>(`/groups/${groupId}`),
		enabled: groupId > 0,
	});
}

/** A group's roster, with per-student attendance rates — the Roster tab. */
export function useGroupStudents(groupId: number) {
	return useQuery({
		queryKey: groupsKeys.students(groupId),
		queryFn: () => teachApi.get<TeachGroupStudent[]>(`/groups/${groupId}/students`),
		enabled: groupId > 0,
	});
}
