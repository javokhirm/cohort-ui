import { useQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';

/**
 * The immutable grading scale a mark was stamped with (api-reference §5.5).
 * Structured rather than a prose label on purpose: the unit shown under a mark
 * chip (`0–10`, `A–F`, `%`) and the scale's name are user-facing text, so they
 * are localized here from `type`/`maxPoints` — see `lib/mark-format.ts`.
 */
export interface MarkScale {
	/** `groupGradingConfigs.id` — stable per scale, so a switch is a change of id. */
	configId: number;
	type: 'POINTS' | 'PERCENTAGE' | 'LETTER';
	/** Numeric max for POINTS/PERCENTAGE; `null` for LETTER. */
	maxPoints: number | null;
	allowHalf: boolean;
}

/** One daily mark of the student's own, in the scale it was given on. */
export interface StudentMark {
	id: number;
	scale: MarkScale;
	rawScore: number | null;
	letter: string | null;
	/** 0–100 — the only figure comparable across scales. */
	normalizedPct: number;
	comment: string | null;
	markedByName: string | null;
	markedAt: string | null;
}

/** One bar of the Progress chart. */
export interface TrendMark {
	sessionId: number;
	sessionDate: string;
	groupId: number;
	scale: MarkScale;
	rawScore: number | null;
	letter: string | null;
	normalizedPct: number;
}

/**
 * The "Class mark average" card (`GET /student/marks/summary`). Hand-mirrored
 * from the backend's `StudentMarkSummaryDto` — the student controllers declare
 * no `@ApiOkResponse`, so there is no generated schema to import.
 */
export interface StudentMarkSummary {
	/** Mean `normalizedPct` of marked classes; `null` when nothing is marked. */
	averagePct: number | null;
	markedCount: number;
	/** Points vs the preceding block of marks; `null` when there are too few. */
	deltaPct: number | null;
	/** The last 10 marks, oldest first — chart order, left to right. */
	recent: TrendMark[];
	/** Distinct scales in use, most recently used first. */
	scales: MarkScale[];
	/** Where the chart breaks: `at` is the first session on the new scale. */
	scaleChange: { at: string; scale: MarkScale } | null;
}

export const markKeys = {
	all: ['marks'] as const,
	summary: (groupId: number | undefined) =>
		[...markKeys.all, 'summary', groupId] as const,
};

/**
 * The mark average, trend and chart for the Progress screen, narrowed to one
 * group when a filter chip is active.
 */
export function useMarkSummary(groupId?: number) {
	return useQuery({
		queryKey: markKeys.summary(groupId),
		queryFn: () =>
			studentApi.get<StudentMarkSummary>('/marks/summary', { params: { groupId } }),
	});
}
