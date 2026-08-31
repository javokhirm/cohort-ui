/**
 * The one-word encouragement each momentum tile wears.
 *
 * Home's audience is 8–18, and a bare "7" or "92%" tells a child nothing about
 * whether that is worth being pleased with. The chips supply that reading — but
 * only ever off a number the endpoint actually returned, and only in a register
 * that stays kind at the bottom of the range: a low streak is an invitation to
 * start one, never a scolding.
 *
 * Keys, not sentences, so the copy itself lives in the catalogs like everything
 * else — and so the thresholds are stated once here instead of drifting between
 * the two tiles.
 */

export type StreakCheer = 'streakStart' | 'streakGoing' | 'streakHot' | 'streakBlazing';

/** Consecutive non-absent sessions → how loudly to cheer it. */
export function streakCheer(streak: number): StreakCheer {
	if (streak >= 7) return 'streakBlazing';
	if (streak >= 3) return 'streakHot';
	if (streak >= 1) return 'streakGoing';
	return 'streakStart';
}

export type AttendanceCheer =
	'attendancePerfect' | 'attendanceGreat' | 'attendanceGood' | 'attendanceClimb';

/** Term attendance rate (0–100) → how loudly to cheer it. */
export function attendanceCheer(rate: number): AttendanceCheer {
	if (rate >= 100) return 'attendancePerfect';
	if (rate >= 90) return 'attendanceGreat';
	if (rate >= 75) return 'attendanceGood';
	return 'attendanceClimb';
}
