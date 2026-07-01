import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import type { PaginatedResult } from '@repo/api-client';

import { hrKeys, type StaffListFilters } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Hand-written to match the backend contract for the `/manage` staff endpoints.
// The generated `@repo/api-client` OpenAPI types are stale and do not yet
// include staff/payroll; regenerate later via the api-client `gen:api` script
// and reconcile these shapes.

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR';
export type StaffStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type StaffRoleName = 'TEACHER' | 'ADMIN' | 'MANAGER';

export interface StaffUser {
	id: number;
	firstName: string;
	lastName: string;
	phone: string;
	email: string | null;
	avatarUrl: string | null;
}

export interface StaffResponse {
	id: number;
	staffCode: string;
	branchId: number;
	branch: { id: number; name: string } | null;
	position: string | null;
	department: string | null;
	specialization: string[];
	employmentType: EmploymentType;
	status: StaffStatus;
	hireDate: string | null;
	baseSalary: number | null;
	roles: string[];
	groupsCount: number;
	weeklyHours: number;
	user: StaffUser;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useStaffList(filters: StaffListFilters) {
	return useQuery({
		queryKey: hrKeys.staffList(filters),
		queryFn: () =>
			manageApi.getPaginated<StaffResponse>('/staff', {
				params: filters,
			}) as Promise<PaginatedResult<StaffResponse>>,
		placeholderData: keepPreviousData,
	});
}

export function useStaffMember(id: number) {
	return useQuery({
		queryKey: hrKeys.staffDetail(id),
		queryFn: () => manageApi.get<StaffResponse>(`/staff/${id}`),
		enabled: id > 0,
	});
}
