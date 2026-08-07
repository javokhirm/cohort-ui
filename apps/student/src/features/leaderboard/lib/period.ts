/** The windows the leaderboard can be ranked over (`period` on the endpoint). */
export const LEADERBOARD_PERIODS = ['month', 'all'] as const;

export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

/** The window the screen opens on when the URL says nothing. */
export const DEFAULT_LEADERBOARD_PERIOD: LeaderboardPeriod = 'month';

/**
 * Narrow an unvalidated search param to a period, falling back to the default.
 *
 * Used by the route's `validateSearch`, so a hand-typed `?period=week` lands on
 * this month rather than reaching the API and coming back a 400.
 */
export function parsePeriod(value: unknown): LeaderboardPeriod {
	return LEADERBOARD_PERIODS.includes(value as LeaderboardPeriod)
		? (value as LeaderboardPeriod)
		: DEFAULT_LEADERBOARD_PERIOD;
}
