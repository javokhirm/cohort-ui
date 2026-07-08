import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { coursesKeys } from './keys';
import type { CourseResponse } from './courses.queries';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateCourseInput {
	/** Null = shared across all branches of the tenant. */
	branchId?: number | null;
	name: string;
	description?: string | null;
	level?: string | null;
	defaultDurationWeeks?: number | null;
}

export interface UpdateCourseInput {
	id: number;
	branchId?: number | null;
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
