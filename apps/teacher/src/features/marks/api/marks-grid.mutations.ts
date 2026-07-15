import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

import type { SessionMark } from './marks.queries';
import { type MarksGrid, marksGridKeys } from './marks-grid.queries';
import { normalizedPctFor } from '../lib/scale';

interface UpsertCellVars {
	sessionId: number;
	studentId: number;
	/** Exactly one of these is set, per the group's active scale type. */
	rawScore?: number | null;
	letter?: string | null;
}

/**
 * Instant single-cell save for the table view (`PUT
 * /teach/sessions/:id/marks/:studentId`) — only today's column is editable.
 * Optimistic: the cell updates immediately (with a best-effort `normalizedPct`
 * from the grid's config), rolls back on error (the global mutation handler
 * shows the toast), and reconciles on settle. The month-scoped AVG/RANK refresh
 * on the invalidation, not optimistically.
 */
export function useUpsertMarkCell(groupId: number, month: string) {
	const qc = useQueryClient();
	const key = marksGridKeys.month(groupId, month);

	return useMutation({
		mutationFn: ({ sessionId, studentId, rawScore, letter }: UpsertCellVars) =>
			teachApi.put<SessionMark>(`/sessions/${sessionId}/marks/${studentId}`, {
				rawScore,
				letter,
			}),
		onMutate: async ({ sessionId, studentId, rawScore, letter }) => {
			await qc.cancelQueries({ queryKey: key });
			const prev = qc.getQueryData<MarksGrid>(key);
			if (prev) {
				const normalizedPct = normalizedPctFor(prev.config, { rawScore, letter });
				qc.setQueryData<MarksGrid>(key, {
					...prev,
					rows: prev.rows.map((row) =>
						row.studentId === studentId
							? {
									...row,
									cells: {
										...row.cells,
										[sessionId]: {
											rawScore: rawScore ?? null,
											letter: letter ?? null,
											normalizedPct,
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
