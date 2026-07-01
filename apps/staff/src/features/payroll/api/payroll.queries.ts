import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import type { PaginatedResult } from '@repo/api-client';

import { payrollKeys, type PayrollListFilters, type PayrollStatus } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Hand-written to match the backend contract for the `/manage` payroll endpoints.
// The generated `@repo/api-client` OpenAPI types are stale and do not yet include
// payroll; regenerate later via the api-client `gen:api` script and reconcile.

export interface PayrollBreakdown {
	hoursTaught?: number;
	rate?: number;
	bonuses?: number;
}

export interface PayrollResponse {
	id: number;
	branchId: number;
	staffId: number;
	staff: {
		id: number;
		staffCode: string;
		firstName: string;
		lastName: string;
	} | null;
	periodStart: string;
	periodEnd: string;
	grossAmount: number;
	deductions: number;
	netAmount: number;
	status: PayrollStatus;
	breakdown: PayrollBreakdown | null;
	approvedByUserId: number | null;
	paidAt: string | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function usePayrollList(filters: PayrollListFilters) {
	return useQuery({
		queryKey: payrollKeys.list(filters),
		queryFn: () =>
			manageApi.getPaginated<PayrollResponse>('/payrolls', {
				params: filters,
			}) as Promise<PaginatedResult<PayrollResponse>>,
		placeholderData: keepPreviousData,
	});
}

export function usePayroll(id: number) {
	return useQuery({
		queryKey: payrollKeys.detail(id),
		queryFn: () => manageApi.get<PayrollResponse>(`/payrolls/${id}`),
		enabled: id > 0,
	});
}
