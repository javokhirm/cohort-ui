import { useQuery } from '@tanstack/react-query';

import type { PaginatedResult } from '@repo/api-client';

import { studentApi } from '@/api/apiClient';

/**
 * One of the student's published results (`GET /student/results`, api-reference §5.5).
 * Hand-mirrored from the backend's `StudentResultDto` — only ever populated from
 * published assessments; unpublished ones can never reach this surface.
 */
export interface StudentResult {
	id: number;
	assessmentId: number;
	groupId: number;
	groupName: string;
	title: string;
	type: 'QUIZ' | 'MIDTERM' | 'FINAL' | 'MOCK' | 'HOMEWORK';
	examDate: string | null;
	score: number | null;
	maxScore: number;
	gradeLabel: string | null;
	percentileRank: number | null;
	feedback: string | null;
	teacherName: string | null;
	gradedAt: string | null;
}

export const resultKeys = {
	all: ['results'] as const,
	list: (groupId: number | undefined) => [...resultKeys.all, 'list', groupId] as const,
};

/**
 * The student's published results, newest exam first, optionally narrowed to one group.
 * One 50-row page — a student's published-result count stays far below that in practice.
 */
export function useResults(groupId?: number) {
	return useQuery({
		queryKey: resultKeys.list(groupId),
		queryFn: () =>
			studentApi.getPaginated<StudentResult>('/results', {
				params: { groupId, limit: 50 },
			}) as Promise<PaginatedResult<StudentResult>>,
	});
}
