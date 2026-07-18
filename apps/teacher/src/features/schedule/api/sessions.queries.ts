import { useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

/**
 * A session in the teacher's calendar (`GET /teach/sessions`, api-reference §4.1)
 * — every session of a group they teach, plus the ones they substitute on.
 *
 * Hand-mirrored from the backend's `TeachSessionCalendarItemDto`: the teach
 * controllers declare no `@ApiOkResponse`, so the OpenAPI document carries no
 * response schema to generate from.
 */
export interface TeachSession {
	id: number;
	branchId: number;
	groupId: number;
	groupName: string;
	courseName: string;
	roomId: number | null;
	roomName: string | null;
	teacherId: number | null;
	teacherName: string | null;
	sessionDate: string;
	startTime: string;
	endTime: string;
	topic: string | null;
	status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
	studentCount: number;
}

export interface SessionRangeFilters {
	/** Inclusive `YYYY-MM-DD`. Both bounds are required; the span may not exceed 90 days. */
	from: string;
	to: string;
}

export const scheduleKeys = {
	all: ['sessions'] as const,
	range: (filters: SessionRangeFilters) =>
		[...scheduleKeys.all, 'range', filters] as const,
	group: (groupId: number) => [...scheduleKeys.all, 'group', groupId] as const,
};

/**
 * The teacher's sessions in a date window.
 *
 * The active branch is deliberately **not** part of the key: `/teach/sessions`
 * accepts no branch param, so branch is a client-side view filter (see
 * `useBranchFilter`). Keying on it would refetch the identical rows on every
 * switch.
 */
export function useSessions(filters: SessionRangeFilters) {
	return useQuery({
		queryKey: scheduleKeys.range(filters),
		queryFn: () => teachApi.get<TeachSession[]>('/sessions', { params: filters }),
	});
}

/**
 * Every session of one group (`GET /teach/groups/:id/sessions`, api-reference
 * §4.2) — the group screen's Schedule tab.
 *
 * Unlike `useSessions`, no date window is required: a group's sessions are
 * already bounded by its own start and end dates, so the whole course comes
 * back. Same row shape, so `TeachSession` is reused rather than re-declared.
 */
export function useGroupSessions(groupId: number) {
	return useQuery({
		queryKey: scheduleKeys.group(groupId),
		queryFn: () => teachApi.get<TeachSession[]>(`/groups/${groupId}/sessions`),
		enabled: groupId > 0,
	});
}
