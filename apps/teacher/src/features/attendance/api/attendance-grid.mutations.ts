import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

import { type AttendanceRecord, type AttendanceStatus } from './attendance.queries';
import { type AttendanceGrid, attendanceGridKeys } from './attendance-grid.queries';

interface UpsertCellVars {
	sessionId: number;
	studentId: number;
	status: AttendanceStatus;
}

/**
 * Instant single-cell save for the table view (`PUT
 * /teach/sessions/:id/attendances/:studentId`) — only today's column is
 * editable. Optimistic: the cell flips immediately, rolls back on error (the
 * global mutation handler shows the toast), and reconciles on settle. The
 * grid's month-scoped RATE refreshes on the invalidation, not optimistically.
 */
export function useUpsertAttendanceCell(groupId: number, month: string) {
	const qc = useQueryClient();
	const key = attendanceGridKeys.month(groupId, month);

	return useMutation({
		mutationFn: ({ sessionId, studentId, status }: UpsertCellVars) =>
			teachApi.put<AttendanceRecord>(
				`/sessions/${sessionId}/attendances/${studentId}`,
				{ status },
			),
		onMutate: async ({ sessionId, studentId, status }) => {
			await qc.cancelQueries({ queryKey: key });
			const prev = qc.getQueryData<AttendanceGrid>(key);
			if (prev) {
				qc.setQueryData<AttendanceGrid>(key, {
					...prev,
					rows: prev.rows.map((row) =>
						row.studentId === studentId
							? {
									...row,
									cells: {
										...row.cells,
										[sessionId]: {
											status,
											note: row.cells[sessionId]?.note ?? null,
										},
									},
								}
							: row,
					),
				});
			}
			return { prev };
		},
		onError: (_err, _vars, context) => {
			if (context?.prev) qc.setQueryData(key, context.prev);
		},
		onSettled: () => {
			void qc.invalidateQueries({ queryKey: key });
		},
	});
}
