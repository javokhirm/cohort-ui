import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import { groupsKeys, type GroupListFilters } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirror the backend academics DTOs for the `/manage` surface (api-reference.md
// §3.7/§3.8). The generated `@repo/api-client` OpenAPI types expose request DTOs
// but not response bodies, so the shapes are declared here; reconcile when the
// spec starts emitting response schemas.

export const GROUP_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export type GroupStatus = (typeof GROUP_STATUSES)[number];

export const SCHEDULE_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type ScheduleDay = (typeof SCHEDULE_DAYS)[number];

export const SESSION_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const ENROLLMENT_STATUSES = [
	'ACTIVE',
	'DROPPED',
	'COMPLETED',
	'TRANSFERRED',
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export interface ScheduleRule {
	days: ScheduleDay[];
	startTime: string;
	endTime: string;
}

/** `GET /manage/groups` list row (`GroupListItemResponseDto`). */
export interface GroupListItem {
	id: number;
	branchId: number;
	courseId: number;
	courseName: string;
	defaultTeacherId: number | null;
	defaultTeacherName: string | null;
	roomId: number | null;
	roomName: string | null;
	name: string;
	capacity: number | null;
	startDate: string | null;
	endDate: string | null;
	scheduleRule: ScheduleRule | null;
	status: GroupStatus;
}

/** `GET /manage/groups/:id` (`GroupDetailResponseDto`). */
export interface GroupDetail extends GroupListItem {
	activeEnrollmentsCount: number;
	sessionCount: number;
	createdAt: string;
	updatedAt: string;
}

/** `GET /manage/groups/:id/enrollments` (`EnrollmentResponseDto`). */
export interface Enrollment {
	id: number;
	groupId: number;
	studentId: number;
	studentName: string;
	studentCode: string;
	feePlanId: number | null;
	enrolledAt: string;
	status: EnrollmentStatus;
	dropReason: string | null;
	completedAt: string | null;
}

/** `GET /manage/sessions` calendar row (`SessionCalendarItemDto`). */
export interface SessionCalendarItem {
	id: number;
	branchId: number;
	groupId: number;
	groupName: string;
	courseName: string;
	roomId: number | null;
	roomName: string | null;
	teacherId: number | null;
	teacherName: string | null;
	sessionDate: string;
	startTime: string;
	endTime: string;
	topic: string | null;
	status: SessionStatus;
}

export interface SessionRosterEntry {
	studentId: number;
	studentName: string;
	enrollmentStatus: EnrollmentStatus;
}

/** `GET /manage/sessions/:id` (`SessionDetailDto`). */
export interface SessionDetail extends SessionCalendarItem {
	cancellationReason: string | null;
	roster: SessionRosterEntry[];
	createdAt: string;
	updatedAt: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useGroupList(filters: GroupListFilters) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// still wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: GroupListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: groupsKeys.groupList(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<GroupListItem>('/groups', {
				params: effectiveFilters,
			}) as Promise<PaginatedResult<GroupListItem>>,
		placeholderData: keepPreviousData,
	});
}

export function useGroup(id: number) {
	return useQuery({
		queryKey: groupsKeys.groupDetail(id),
		queryFn: () => manageApi.get<GroupDetail>(`/groups/${id}`),
		enabled: id > 0,
	});
}

/** Enrolled students for a group (`GET /manage/groups/:id/enrollments`). */
export function useGroupEnrollments(id: number, status?: EnrollmentStatus) {
	return useQuery({
		queryKey: groupsKeys.groupEnrollments(id, status),
		queryFn: () =>
			manageApi.get<Enrollment[]>(`/groups/${id}/enrollments`, {
				params: status ? { status } : undefined,
			}),
		enabled: id > 0,
	});
}

/** Generated sessions for a group (`GET /manage/groups/:id/sessions`). */
export function useGroupSessions(id: number) {
	return useQuery({
		queryKey: groupsKeys.groupSessions(id),
		queryFn: () => manageApi.get<SessionCalendarItem[]>(`/groups/${id}/sessions`),
		enabled: id > 0,
	});
}
