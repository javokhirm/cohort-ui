import type { StudentSession } from '../api/home.queries';

export interface NextClassInfo {
	session: StudentSession;
	/** Happening right now (between its start and end time). */
	isLive: boolean;
	/** Every session today is over — `session` is the last one that ran. */
	isDone: boolean;
	/** 0–100, only meaningful when `isLive`. */
	progressPct: number;
	/** Whole minutes until it starts. `0` once it has — only meaningful when neither live nor done. */
	minutesToStart: number;
	/** Whole minutes until it ends, rounded up. Only meaningful when `isLive`. */
	minutesLeft: number;
	/** How many of today's sessions are already `COMPLETED` — the "done" hero's tally. */
	completedToday: number;
}

/** Milliseconds → whole minutes, never negative. */
function minutesBetween(fromMs: number, toMs: number, round: 'floor' | 'ceil'): number {
	const minutes = (toMs - fromMs) / 60_000;
	if (minutes <= 0) return 0;
	return round === 'floor' ? Math.floor(minutes) : Math.ceil(minutes);
}

/**
 * The Home hero card's subject: the first still-`SCHEDULED` session today, or the day's
 * last session once none remain. The backend auto-completes a session the moment its end
 * time passes (`SessionCompletionService.sweepTenant`), so "first SCHEDULED" is always the
 * true current/next class — no client-side clock math needed to pick it.
 *
 * The clock *is* needed for the countdown the card shows around that choice, so `now` is
 * a parameter rather than read here: the caller drives it from `useNow()`, which is what
 * makes "starts in 25 min" tick down instead of freezing at whatever it said on mount.
 */
export function resolveNextClass(
	todaySessions: StudentSession[],
	now: Date = new Date(),
): NextClassInfo | null {
	const completedToday = todaySessions.filter((s) => s.status === 'COMPLETED').length;
	const nowMs = now.getTime();

	const upcoming = todaySessions.find((s) => s.status === 'SCHEDULED');
	if (upcoming) {
		const start = new Date(`${upcoming.sessionDate}T${upcoming.startTime}`).getTime();
		const end = new Date(`${upcoming.sessionDate}T${upcoming.endTime}`).getTime();
		const isLive = nowMs >= start && nowMs < end;
		return {
			session: upcoming,
			isLive,
			isDone: false,
			progressPct: isLive
				? Math.min(100, Math.max(0, ((nowMs - start) / (end - start)) * 100))
				: 0,
			// Floored, so "1 min" only ever means "under two minutes away".
			minutesToStart: minutesBetween(nowMs, start, 'floor'),
			// Ceiled, so a class with 30 seconds left still reads "1 min left"
			// rather than "0 min left" while it is demonstrably still running.
			minutesLeft: isLive ? minutesBetween(nowMs, end, 'ceil') : 0,
			completedToday,
		};
	}

	const last = todaySessions[todaySessions.length - 1];
	return last
		? {
				session: last,
				isLive: false,
				isDone: true,
				progressPct: 0,
				minutesToStart: 0,
				minutesLeft: 0,
				completedToday,
			}
		: null;
}
