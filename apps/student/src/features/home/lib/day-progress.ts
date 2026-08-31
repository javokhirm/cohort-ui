import type { StudentSession } from '../api/home.queries';

export interface DayProgress {
	/** Sessions that can actually be attended — cancelled ones are not a target to hit. */
	total: number;
	/** How many of those are already `COMPLETED`. */
	done: number;
	/** 0–100. `0` when the day holds nothing to complete. */
	pct: number;
}

/**
 * "2 of 3 done" for today's timeline header — the small, honest bit of progress
 * feedback the Home screen can give a student at a glance.
 *
 * Cancelled sessions are excluded from *both* sides rather than counted as done:
 * a day whose only class was called off is not a day the student completed, and
 * showing it as 100% would celebrate something that never happened. It is
 * derived entirely from the statuses `GET /student/home` already returned — this
 * screen invents no progress the backend did not report.
 */
export function dayProgress(sessions: StudentSession[]): DayProgress {
	const attendable = sessions.filter((s) => s.status !== 'CANCELLED');
	const done = attendable.filter((s) => s.status === 'COMPLETED').length;
	const total = attendable.length;
	return { total, done, pct: total === 0 ? 0 : (done / total) * 100 };
}
