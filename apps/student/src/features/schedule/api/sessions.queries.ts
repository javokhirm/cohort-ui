import { useQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';

/**
 * A session in the student's calendar (`GET /student/sessions`, api-reference §5.3) and
 * inside `GET /student/home`'s `todaySessions`.
 *
 * Hand-mirrored from the backend's `StudentSessionDto`: the student controllers declare
 * no `@ApiOkResponse`, so the OpenAPI document carries no response schema to generate
 * from (same convention as `apps/teacher`'s `TeachSession`).
 */
export interface StudentSession {
	id: number;
	groupId: number;
	groupName: string;
	courseName: string;
	roomName: string | null;
	teacherName: string | null;
	sessionDate: string;
	startTime: string;
	endTime: string;
	topic: string | null;
	status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

/** Full session detail (`GET /student/sessions/:id`) — adds the cancellation reason. */
export interface StudentSessionDetail extends StudentSession {
	/** Set only when status is CANCELLED. */
	cancellationReason: string | null;
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
	detail: (id: number) => [...scheduleKeys.all, 'detail', id] as const,
};

/** The student's sessions across their enrolled groups, in a Mon–Sun window. */
export function useSessions(filters: SessionRangeFilters) {
	return useQuery({
		queryKey: scheduleKeys.range(filters),
		queryFn: () => studentApi.get<StudentSession[]>('/sessions', { params: filters }),
	});
}

/** One session's detail — must belong to a group the student is/was enrolled in. */
export function useSessionDetail(id: number) {
	return useQuery({
		queryKey: scheduleKeys.detail(id),
		queryFn: () => studentApi.get<StudentSessionDetail>(`/sessions/${id}`),
		enabled: id > 0,
	});
}
