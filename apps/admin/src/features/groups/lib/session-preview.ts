import type { ScheduleDay } from '../api/groups.queries';
import { dayCodeFromDate, toYmd } from './group-options';

/**
 * Every session date (`YYYY-MM-DD`) a weekly schedule rule produces across
 * `[startDate, endDate]`, inclusive — mirrors the backend
 * `SessionGeneratorService` without a round trip, for the create/edit form's
 * live preview.
 */
export function generateSessionDates(
	days: ScheduleDay[],
	startDate?: string,
	endDate?: string,
): string[] {
	if (days.length === 0 || !startDate || !endDate || endDate < startDate) return [];

	const daySet = new Set(days);
	const dates: string[] = [];
	const cursor = new Date(`${startDate}T00:00:00`);
	const end = new Date(`${endDate}T00:00:00`);
	while (cursor <= end) {
		if (daySet.has(dayCodeFromDate(cursor))) {
			dates.push(toYmd(cursor));
		}
		cursor.setDate(cursor.getDate() + 1);
	}
	return dates;
}
