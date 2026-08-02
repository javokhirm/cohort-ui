import { useQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';
import type { StudentMark } from '@/features/progress/api/marks.queries';
import type { StudentSession } from '@/features/schedule/api/sessions.queries';

export type { StudentSession };

/**
 * The newest daily session mark, for Home's "Latest mark" card. Replaced the
 * published-assessment "latest result" when Progress became a class log.
 */
export interface StudentLatestMark {
	sessionId: number;
	sessionDate: string;
	groupId: number;
	groupName: string;
	topic: string | null;
	mark: StudentMark;
	/** Points vs the previous mark in the same group; `null` when it is the first. */
	deltaPct: number | null;
}

/**
 * The Home screen in one round trip (`GET /student/home`) — today's sessions, the
 * attendance rate/streak, the latest daily mark, the outstanding balance, and the
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
	latestMark: StudentLatestMark | null;
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
