import { useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

/** Attendance status vocabulary (mirrors the backend `ATTENDANCE_STATUSES`). */
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

/** The four marks a teacher can pick, in display order. */
export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
	'PRESENT',
	'ABSENT',
	'LATE',
	'EXCUSED',
];

/**
 * A marked attendance record (`GET /teach/sessions/:id/attendances`,
 * api-reference §4.3). Hand-mirrored from `AttendanceResponseDto` — the teach
 * controllers declare no `@ApiOkResponse`, so there is no schema to generate.
 */
export interface AttendanceRecord {
	id: number;
	sessionId: number;
	studentId: number;
	studentName: string | null;
	status: AttendanceStatus;
	note: string | null;
	markedByStaffId: number | null;
	markedAt: string | null;
}

/** One student on a session's roster (from `TeachSessionDetailDto.roster`). */
export interface SessionRosterEntry {
	studentId: number;
	studentName: string;
	enrollmentStatus: string;
}

/**
 * Session detail incl. the active roster (`GET /teach/sessions/:id`,
 * api-reference §4.1). Hand-mirrored subset of `TeachSessionDetailDto` — the
 * fields the attendance/marks screens need for their header and roster.
 */
export interface SessionDetail {
	id: number;
	groupId: number;
	groupName: string;
	courseName: string;
	roomName: string | null;
	sessionDate: string;
	startTime: string;
	endTime: string;
	topic: string | null;
	status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
	studentCount: number;
	cancellationReason: string | null;
	roster: SessionRosterEntry[];
}

export const attendanceKeys = {
	all: ['attendance'] as const,
	detail: (sessionId: number) => [...attendanceKeys.all, 'detail', sessionId] as const,
	records: (sessionId: number) =>
		[...attendanceKeys.all, 'records', sessionId] as const,
};

/** A session's detail + active roster — the header and student rows of the list view. */
export function useSessionDetail(sessionId: number) {
	return useQuery({
		queryKey: attendanceKeys.detail(sessionId),
		queryFn: () => teachApi.get<SessionDetail>(`/sessions/${sessionId}`),
	});
}

/** The already-marked attendance for a session (empty until first submitted). */
export function useSessionAttendance(sessionId: number) {
	return useQuery({
		queryKey: attendanceKeys.records(sessionId),
		queryFn: () =>
			teachApi.get<AttendanceRecord[]>(`/sessions/${sessionId}/attendances`),
	});
}
