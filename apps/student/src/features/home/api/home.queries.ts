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
 * My standing in my primary group this month, for Home's leaderboard card. The
 * server picks the group (the one I was most recently marked in) and decides
 * whether there is a rank worth reporting at all, so a `null` here means the
 * card does not render — not that something failed.
 */
export interface StudentHomeLeaderboard {
	groupId: number;
	groupName: string;
	rank: number;
	/** The denominator: "4th of 12". Counts ranked students, not the whole group. */
	rankedCount: number;
	/** Another student shares this rank. */
	tied: boolean;
}

/**
 * The Home screen in one round trip (`GET /student/home`) — today's sessions, the
 * attendance rate/streak, the latest daily mark, the outstanding balance, the
 * unread notification count and this month's leaderboard standing. Mirrors the
 * backend's `StudentHomeDto`
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
	leaderboard: StudentHomeLeaderboard | null;
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
