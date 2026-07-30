import { useQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';

/**
 * A session in today's calendar, as returned inside `StudentHome.todaySessions`
 * (`GET /student/home`, composed from api-reference §5.3's session shape).
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

export interface StudentLatestResult {
	id: number;
	title: string;
	type: string;
	score: number | null;
	maxScore: number;
	gradeLabel: string | null;
	groupName: string;
}

/**
 * The Home screen in one round trip (`GET /student/home`) — today's sessions, the
 * attendance rate/streak, the latest published result, the outstanding balance, and the
 * unread notification count. Mirrors the backend's `StudentHomeDto`
 * (`cohort-be/src/api/student/dto/home/home-response.dto.ts`).
 */
export interface StudentHome {
	todaySessions: StudentSession[];
	attendance: {
		/** PRESENT/LATE over all marked sessions, already 0–100. `null` when nothing is marked yet. */
		rate: number | null;
		/** Consecutive most-recent non-absent sessions. */
		streak: number;
	};
	latestResult: StudentLatestResult | null;
	outstanding: number;
	currency: string;
	unreadCount: number;
}

export const homeKeys = {
	all: ['home'] as const,
};

export function useHome() {
	return useQuery({
		queryKey: homeKeys.all,
		queryFn: () => studentApi.get<StudentHome>('/home'),
	});
}
