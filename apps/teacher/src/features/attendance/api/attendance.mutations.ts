import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

import {
	type AttendanceRecord,
	type AttendanceStatus,
	attendanceKeys,
	type SessionDetail,
} from './attendance.queries';

/** One student's attendance in a save payload. */
export interface AttendanceInput {
	studentId: number;
	status: AttendanceStatus;
	note?: string | null;
}

/**
 * Save a session's attendance in one action (the list view's "Save attendance").
 * The backend splits create-only (`POST`, 409 on an existing row) from
 * update-only (`PATCH`, 404 on a missing row), so the caller partitions rows by
 * whether they were already marked; each non-empty side is sent as one batch.
 */
export function useSaveAttendance(sessionId: number) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: {
			create: AttendanceInput[];
			update: AttendanceInput[];
		}) => {
			const calls: Promise<AttendanceRecord[]>[] = [];
			if (payload.create.length > 0) {
				calls.push(
					teachApi.post<AttendanceRecord[]>(
						`/sessions/${sessionId}/attendances`,
						{
							records: payload.create,
						},
					),
				);
			}
			if (payload.update.length > 0) {
				calls.push(
					teachApi.patch<AttendanceRecord[]>(
						`/sessions/${sessionId}/attendances`,
						{
							records: payload.update,
						},
					),
				);
			}
			await Promise.all(calls);
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: attendanceKeys.records(sessionId) });
		},
	});
}

/**
 * Set the session's "Topic covered / session note" (`PATCH /teach/sessions/:id`).
 * Topic-only — a teacher cannot reschedule or cancel through this route.
 */
export function useSetSessionTopic(sessionId: number) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (topic: string) =>
			teachApi.patch<SessionDetail>(`/sessions/${sessionId}`, { topic }),
		onSuccess: (data) => {
			qc.setQueryData(attendanceKeys.detail(sessionId), data);
		},
	});
}
