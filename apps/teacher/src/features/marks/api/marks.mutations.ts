import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

import { marksKeys, type SessionMark } from './marks.queries';

/**
 * One student's mark in a save payload. Exactly one of `rawScore` (POINTS/
 * PERCENTAGE) | `letter` (LETTER) should be set; the backend validates the
 * pairing against the group's active grading config.
 */
export interface MarkInput {
	studentId: number;
	rawScore?: number | null;
	letter?: string | null;
	note?: string | null;
}

/**
 * Save a session's marks in one action (the list view's "Save marks"). Like
 * attendance, the backend splits create-only (`POST`, 409 on an existing row)
 * from update-only (`PATCH`, 404 on a missing row), so the caller partitions
 * rows by whether they were already marked; each non-empty side is one batch.
 */
export function useSaveMarks(sessionId: number) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: { create: MarkInput[]; update: MarkInput[] }) => {
			const calls: Promise<SessionMark[]>[] = [];
			if (payload.create.length > 0) {
				calls.push(
					teachApi.post<SessionMark[]>(`/sessions/${sessionId}/marks`, {
						records: payload.create,
					}),
				);
			}
			if (payload.update.length > 0) {
				calls.push(
					teachApi.patch<SessionMark[]>(`/sessions/${sessionId}/marks`, {
						records: payload.update,
					}),
				);
			}
			await Promise.all(calls);
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: marksKeys.session(sessionId) });
		},
	});
}
