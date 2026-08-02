import { useQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';

import type { AttendanceStatus } from './class-log.queries';

export type { AttendanceStatus };

/**
 * Attendance snapshot (`GET /student/attendance/summary`, §5.4): the rate ring,
 * per-status counts, current streak and the last-14-classes strip.
 */
export interface StudentAttendanceSummary {
	/** PRESENT/LATE over all marked sessions, already 0–100. `null` when nothing is marked. */
	rate: number | null;
	counts: { present: number; absent: number; late: number; excused: number };
	/** Consecutive most-recent non-absent sessions. */
	streak: number;
	recent: { sessionDate: string; status: AttendanceStatus }[];
}

export const attendanceKeys = {
	all: ['attendance'] as const,
	summary: (groupId: number | undefined) =>
		[...attendanceKeys.all, 'summary', groupId] as const,
};

/**
 * The Progress screen's attendance card: rate, counts, streak, recent strip —
 * narrowed to one group when a filter chip is active, so the donut and the strip
 * always describe the same classes as the mark average and the log beside them.
 *
 * The paginated `GET /student/attendance` history is no longer used here: the
 * class log supersedes it, since it carries the same attendance rows *plus* each
 * session's daily mark.
 */
export function useAttendanceSummary(groupId?: number) {
	return useQuery({
		queryKey: attendanceKeys.summary(groupId),
		queryFn: () =>
			studentApi.get<StudentAttendanceSummary>('/attendance/summary', {
				params: { groupId },
			}),
	});
}
