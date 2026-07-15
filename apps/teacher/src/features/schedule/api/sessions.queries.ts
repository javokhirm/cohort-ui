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
