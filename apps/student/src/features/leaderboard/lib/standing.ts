/**
 * The two judgements the leaderboard screen and Home's card must agree on, kept
 * out of both so they cannot drift — the same split `place.ts` and `period.ts`
 * already make between policy and rendering.
 *
 * Everything else the screen needs travels in the response (`minMarks`,
 * `minCohort`, `namesRevealed`, …). What lives here is deliberately *not* server
 * policy: it is presentation judgement the endpoint has no opinion on.
 */

/**
 * Enrollments that get a board, mirroring the server's roster rule
 * (`LEADERBOARD_ROSTER_STATUSES`, cohort-be `leaderboard-policy.ts`). A past
 * enrollment still explains a student's marks, but it is not ranked against
 * classmates who are still attending — so `DROPPED`, `SUSPENDED` and
 * `TRANSFERRED` get no board either.
 *
 * This one *is* a mirror of server policy, and the only one left: it decides
 * which chips the screen offers before any request is made, so there is no
 * response to read it from. Every threshold that shapes a board the server has
 * already built is read off the payload instead.
 */
export const RANKABLE_ENROLLMENTS = new Set(['ACTIVE', 'COMPLETED']);

/** Below this many ranked students a percentile says nothing a rank doesn't. */
const MIN_RANKED_FOR_PERCENTILE = 4;

/** Past the halfway mark, "top N%" stops being a distinction. */
const PERCENTILE_CEILING = 0.5;

/**
 * The "Top N%" a placing earns, or `null` when it has not earned one.
 *
 * The raw `rank / rankedCount` is defined for everybody, which is the trap: it
 * hands the last-placed student a sparkling "Top 100%" chip, and the winner of a
 * group of three a "Top 33%" that reads worse than the "1 of 3" beside it. A
 * percentile is only worth showing when it is *both* drawn from enough students
 * to mean something and actually flattering, so it is withheld below
 * {@link MIN_RANKED_FOR_PERCENTILE} ranked students and past the halfway mark.
 *
 * Rounds up from 1 rather than 0 — a winner is in the top 1%, never the top 0%.
 */
export function topPercentile(rank: number, rankedCount: number): number | null {
	if (rankedCount < MIN_RANKED_FOR_PERCENTILE) return null;
	if (rank / rankedCount > PERCENTILE_CEILING) return null;
	return Math.max(1, Math.round((rank / rankedCount) * 100));
}
