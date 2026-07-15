import { useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

import type { MarkConfig } from './marks.queries';

/** One column of the grid: a session in the selected month. */
export interface MarksGridColumn {
	sessionId: number;
	date: string;
	topic: string | null;
	status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

/** One marked cell (a student's mark for a session). */
export interface MarksGridCell {
	rawScore: number | null;
	letter: string | null;
	normalizedPct: number;
	note: string | null;
}

/** One row of the grid: a rostered student, their cells, and their month summary. */
export interface MarksGridRow {
	studentId: number;
	studentName: string | null;
	/** Marked cells keyed by sessionId; unmarked sessions are absent. */
	cells: Record<number, MarksGridCell>;
	markedCount: number;
	/** Month average as a percentage (all scale types), or null when unmarked. */
	averagePct: number | null;
	/** Strict rank within the group by average, or null when unmarked. */
	rank: number | null;
}

/**
 * The monthly marks grid (`GET /teach/groups/:id/marks?month=YYYY-MM`, §1.1).
 * Hand-mirrored from `MarksGridResponseDto`.
 */
export interface MarksGrid {
	group: { id: number; name: string; courseName: string };
	month: string;
	config: MarkConfig;
	columns: MarksGridColumn[];
	rows: MarksGridRow[];
}

export const marksGridKeys = {
	all: ['marks-grid'] as const,
	month: (groupId: number, month: string) =>
		[...marksGridKeys.all, groupId, month] as const,
};

/** A group's marks matrix for one month (students × session dates + AVG% and RANK). */
export function useMarksGrid(groupId: number, month: string) {
	return useQuery({
		queryKey: marksGridKeys.month(groupId, month),
		queryFn: () =>
			teachApi.get<MarksGrid>(`/groups/${groupId}/marks`, {
				params: { month },
			}),
	});
}
