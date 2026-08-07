import { useQuery } from '@tanstack/react-query';

import type { components } from '@repo/api-client';

import { studentApi } from '@/api/apiClient';
import type { LeaderboardPeriod } from '../lib/period';

/**
 * One row of the group leaderboard (`GET /student/leaderboard`, api-reference
 * §5.5a).
 *
 * Taken from the generated schema rather than hand-mirrored — unlike the rest
 * of this app's student DTOs, the leaderboard controller declares an
 * `@ApiOkResponse`, so the spec carries the real shape.
 *
 * **There is no `studentId` on a row, by design.** The server omits every peer
 * identifier so anonymous rows cannot be joined back to a name across requests.
 * Find the viewer's row with `isMe`; never try to key rows by student.
 */
export type StudentLeaderboardRow = components['schemas']['StudentLeaderboardRowDto'];

/**
 * A group's leaderboard over one window.
 *
 * `me` is always present — including when the student is unranked or the cohort
 * is too small to rank — so the screen can always answer "where am I". `rows`
 * holds only ranked students and is capped server-side, so the viewer may not
 * be in it; render `me` separately rather than searching `rows`.
 */
export type StudentLeaderboard = components['schemas']['StudentLeaderboardDto'];

export const leaderboardKeys = {
	all: ['leaderboard'] as const,
	board: (groupId: number | undefined, period: LeaderboardPeriod) =>
		[...leaderboardKeys.all, 'board', groupId, period] as const,
};

/**
 * One group's leaderboard. Disabled until a group is chosen — the endpoint
 * requires `groupId` and there is no all-groups board to fall back to.
 */
export function useLeaderboard(groupId: number | undefined, period: LeaderboardPeriod) {
	return useQuery({
		queryKey: leaderboardKeys.board(groupId, period),
		queryFn: () =>
			studentApi.get<StudentLeaderboard>('/leaderboard', {
				params: { groupId, period },
			}),
		enabled: groupId !== undefined && groupId > 0,
	});
}
