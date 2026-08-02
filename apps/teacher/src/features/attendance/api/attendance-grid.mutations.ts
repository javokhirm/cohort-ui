import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

import { type AttendanceInput } from './attendance.mutations';
import { type AttendanceRecord, type AttendanceStatus } from './attendance.queries';
import { type AttendanceGrid, attendanceGridKeys } from './attendance-grid.queries';

interface UpsertCellVars {
	sessionId: number;
	studentId: number;
	status: AttendanceStatus;
}

/**
 * Instant single-cell save for the table view (`PUT
 * /teach/sessions/:id/attendances/:studentId`) — editable for any
 * past-or-today, non-cancelled session. Optimistic: the cell flips
 * immediately, rolls back on error (the global mutation handler shows the
 * toast), and reconciles on settle. The grid's month-scoped RATE refreshes on
 * the invalidation, not optimistically.
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

interface MarkAllPresentVars {
	sessionId: number;
	/** Every rostered student's id, to be set to PRESENT. */
	studentIds: number[];
	/** The subset that already has a record for this session (PATCH, not POST). */
	alreadyMarkedIds: number[];
}

/**
 * "Mark all present" shortcut for the table view — batch-sets today's column to
 * PRESENT for the whole roster (`POST`/`PATCH /teach/sessions/:id/attendances`),
 * split by whether each student already has a record, same as the list view's
 * `useSaveAttendance`. Optimistic and cache-scoped like `useUpsertAttendanceCell`.
 */
export function useMarkAllPresent(groupId: number, month: string) {
	const qc = useQueryClient();
	const key = attendanceGridKeys.month(groupId, month);

	return useMutation({
		mutationFn: async ({
			sessionId,
			studentIds,
			alreadyMarkedIds,
		}: MarkAllPresentVars) => {
			const alreadyMarked = new Set(alreadyMarkedIds);
			const create: AttendanceInput[] = [];
			const update: AttendanceInput[] = [];
			for (const studentId of studentIds) {
				const row: AttendanceInput = { studentId, status: 'PRESENT' };
				(alreadyMarked.has(studentId) ? update : create).push(row);
			}
			const calls: Promise<AttendanceRecord[]>[] = [];
			if (create.length > 0) {
				calls.push(
					teachApi.post<AttendanceRecord[]>(
						`/sessions/${sessionId}/attendances`,
						{
							records: create,
						},
					),
				);
			}
			if (update.length > 0) {
				calls.push(
					teachApi.patch<AttendanceRecord[]>(
						`/sessions/${sessionId}/attendances`,
						{
							records: update,
						},
					),
				);
			}
			await Promise.all(calls);
		},
		onMutate: async ({ sessionId, studentIds }) => {
			await qc.cancelQueries({ queryKey: key });
			const prev = qc.getQueryData<AttendanceGrid>(key);
			if (prev) {
				const ids = new Set(studentIds);
				qc.setQueryData<AttendanceGrid>(key, {
					...prev,
					rows: prev.rows.map((row) =>
						ids.has(row.studentId)
							? {
									...row,
									cells: {
										...row.cells,
										[sessionId]: {
											status: 'PRESENT',
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
