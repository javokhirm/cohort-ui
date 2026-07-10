import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { coursesKeys } from './keys';
import type { CourseResponse } from './courses.queries';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateCourseInput {
	/** Null = shared across all branches of the tenant. */
	branchId?: number | null;
	/**
	 * Required. The plan every group of this course bills on. Must be active and
	 * branch-compatible, else 404 `FEE_PLAN_NOT_FOUND` / 400
	 * `FEE_PLAN_BRANCH_MISMATCH`.
	 */
	feePlanId: number;
	name: string;
	description?: string | null;
	level?: string | null;
	defaultDurationWeeks?: number | null;
}

export interface UpdateCourseInput {
	id: number;
	branchId?: number | null;
	/** Re-validated against the course's branch whenever either side changes. */
	feePlanId?: number;
	name?: string;
	description?: string | null;
	level?: string | null;
	defaultDurationWeeks?: number | null;
	isActive?: boolean;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateCourse() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateCourseInput) =>
			manageApi.post<CourseResponse>('/courses', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: coursesKeys.courses() });
		},
	});
}

export function useUpdateCourse() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateCourseInput) =>
			manageApi.patch<CourseResponse>(`/courses/${id}`, body),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: coursesKeys.courses() });
		},
	});
}
