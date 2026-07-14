import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
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
/** How auto-calculated payroll derives the gross (backend §3.4). */
export type PayrollType = 'FIXED' | 'PERCENT';

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
	payrollType: PayrollType;
	/** Revenue-share percentage; set only when `payrollType` is `PERCENT`. */
	payrollPercent: number | null;
	roles: string[];
	groupsCount: number;
	weeklyHours: number;
	user: StaffUser;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useStaffList(filters: StaffListFilters) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// still wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: StaffListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: hrKeys.staffList(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<StaffResponse>('/staff', {
				params: effectiveFilters,
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
