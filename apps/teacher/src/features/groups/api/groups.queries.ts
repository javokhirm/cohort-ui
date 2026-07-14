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
 * OpenAPI document to generate from. Note it carries no student count, despite
 * what §4.2's prose says; don't render one.
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
}

export interface GroupListFilters {
	page?: number;
	limit?: number;
	status?: GroupStatus;
}

export const groupsKeys = {
	all: ['groups'] as const,
	list: (filters: GroupListFilters) => [...groupsKeys.all, 'list', filters] as const,
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
