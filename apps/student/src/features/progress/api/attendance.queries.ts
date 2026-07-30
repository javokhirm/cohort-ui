import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

/** One of the student's attendance records (`GET /student/attendance`, §5.4). */
export interface StudentAttendanceRecord {
	id: number;
	sessionDate: string;
	groupName: string;
	status: AttendanceStatus;
	note: string | null;
}

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

const HISTORY_PAGE_SIZE = 8;

export const attendanceKeys = {
	all: ['attendance'] as const,
	summary: () => [...attendanceKeys.all, 'summary'] as const,
	history: () => [...attendanceKeys.all, 'history'] as const,
};

/** The Attendance tab's header card: rate, counts, streak, recent strip. */
export function useAttendanceSummary() {
	return useQuery({
		queryKey: attendanceKeys.summary(),
		queryFn: () => studentApi.get<StudentAttendanceSummary>('/attendance/summary'),
	});
}

/**
 * The paginated attendance history, newest session first — the design's "Load 8 more"
 * list, so pages are 8 rows and accumulate.
 */
export function useAttendanceHistory() {
	return useInfiniteQuery({
		queryKey: attendanceKeys.history(),
		queryFn: ({ pageParam }) =>
			studentApi.getPaginated<StudentAttendanceRecord>('/attendance', {
				params: { page: pageParam, limit: HISTORY_PAGE_SIZE },
			}),
		initialPageParam: 1,
		getNextPageParam: (last) =>
			last.page < last.totalPages ? last.page + 1 : undefined,
	});
}
