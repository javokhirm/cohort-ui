import { useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

import type { AttendanceStatus } from './attendance.queries';

/** One column of the grid: a session in the selected month. */
export interface AttendanceGridColumn {
	sessionId: number;
	date: string;
	topic: string | null;
	status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

/** One marked cell (a student's status for a session). */
export interface AttendanceGridCell {
	status: AttendanceStatus;
	note: string | null;
}

/** One row of the grid: a rostered student, their cells, and their month rate. */
export interface AttendanceGridRow {
	studentId: number;
	studentName: string | null;
	/** Marked cells keyed by sessionId; unmarked sessions are absent. */
	cells: Record<number, AttendanceGridCell>;
	rate: number | null;
}

/**
 * The monthly attendance grid (`GET /teach/groups/:id/attendance?month=YYYY-MM`,
 * api-reference §4.3). Hand-mirrored from `AttendanceGridResponseDto`.
 */
export interface AttendanceGrid {
	group: { id: number; name: string; courseName: string };
	month: string;
	columns: AttendanceGridColumn[];
	rows: AttendanceGridRow[];
}

export const attendanceGridKeys = {
	all: ['attendance-grid'] as const,
	month: (groupId: number, month: string) =>
		[...attendanceGridKeys.all, groupId, month] as const,
};

/** A group's attendance matrix for one month (students × session dates + RATE). */
export function useAttendanceGrid(groupId: number, month: string) {
	return useQuery({
		queryKey: attendanceGridKeys.month(groupId, month),
		queryFn: () =>
			teachApi.get<AttendanceGrid>(`/groups/${groupId}/attendance`, {
				params: { month },
			}),
	});
}
