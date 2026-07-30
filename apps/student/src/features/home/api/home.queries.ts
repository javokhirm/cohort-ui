import { useQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';
import type { StudentSession } from '@/features/schedule/api/sessions.queries';

export type { StudentSession };

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
