import type { StudentSession } from '../api/home.queries';

export interface NextClassInfo {
	session: StudentSession;
	/** Happening right now (between its start and end time). */
	isLive: boolean;
	/** Every session today is over — `session` is the last one that ran. */
	isDone: boolean;
	/** 0–100, only meaningful when `isLive`. */
	progressPct: number;
}

/**
 * The Home hero card's subject: the first still-`SCHEDULED` session today, or the day's
 * last session once none remain. The backend auto-completes a session the moment its end
 * time passes (`SessionCompletionService.sweepTenant`), so "first SCHEDULED" is always the
 * true current/next class — no client-side clock math needed to pick it.
 */
export function resolveNextClass(todaySessions: StudentSession[]): NextClassInfo | null {
	const upcoming = todaySessions.find((s) => s.status === 'SCHEDULED');
	if (upcoming) {
		const start = new Date(`${upcoming.sessionDate}T${upcoming.startTime}`);
		const end = new Date(`${upcoming.sessionDate}T${upcoming.endTime}`);
		const now = new Date();
		const isLive = now >= start && now < end;
		const progressPct = isLive
			? Math.min(
					100,
					Math.max(
						0,
						((now.getTime() - start.getTime()) /
							(end.getTime() - start.getTime())) *
							100,
					),
				)
			: 0;
		return { session: upcoming, isLive, isDone: false, progressPct };
	}
	const last = todaySessions[todaySessions.length - 1];
	return last ? { session: last, isLive: false, isDone: true, progressPct: 0 } : null;
}
