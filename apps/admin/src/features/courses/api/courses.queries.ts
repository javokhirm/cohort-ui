import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import { coursesKeys, type CourseListFilters } from './keys';

export type GroupStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

/**
 * A group running a course — subset of the backend `GroupListItemResponseDto`
 * (`GET /manage/groups?courseId=`) used by the course detail page.
 */
export interface CourseGroup {
	id: number;
	name: string;
	branchId: number;
	courseId: number;
	courseName: string;
	defaultTeacherId: number | null;
	defaultTeacherName: string | null;
	roomId: number | null;
	roomName: string | null;
	capacity: number | null;
	status: GroupStatus;
}

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend `CourseResponseDto` for the `/manage/courses` surface
// (api-reference.md §3.6). The generated `@repo/api-client` OpenAPI types expose
// the request DTOs but not response bodies, so the shape is declared here.

export interface CourseResponse {
	id: number;
	/** Null = shared across all branches of the tenant. */
	branchId: number | null;
	/** The plan every group of this course bills on (always set). */
	feePlanId: number;
	name: string;
	description: string | null;
	level: string | null;
	defaultDurationWeeks: number | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useCourseList(filters: CourseListFilters) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// still wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: CourseListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: coursesKeys.courseList(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<CourseResponse>('/courses', {
				params: effectiveFilters,
			}) as Promise<PaginatedResult<CourseResponse>>,
		placeholderData: keepPreviousData,
	});
}

export function useCourse(id: number) {
	return useQuery({
		queryKey: coursesKeys.courseDetail(id),
		queryFn: () => manageApi.get<CourseResponse>(`/courses/${id}`),
		enabled: id > 0,
	});
}

/** Active groups running a course (`GET /manage/groups?courseId=&status=ACTIVE`). */
export function useCourseGroups(courseId: number) {
	return useQuery({
		queryKey: coursesKeys.courseGroups(courseId),
		queryFn: () =>
			manageApi.getPaginated<CourseGroup>('/groups', {
				params: { courseId, status: 'ACTIVE', limit: 100 },
			}) as Promise<PaginatedResult<CourseGroup>>,
		enabled: courseId > 0,
	});
}
