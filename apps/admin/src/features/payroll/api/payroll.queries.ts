import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import {
	payrollKeys,
	type PayrollListFilters,
	type PayrollStatus,
	type PayrollSummaryFilters,
} from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Hand-written to match the backend contract for the `/manage` payroll endpoints.
// The generated `@repo/api-client` OpenAPI types are stale and do not yet include
// payroll; regenerate later via the api-client `gen:api` script and reconcile.

/** Days of the requested period excluded because a live payroll already covers them. */
export interface PayrollSkippedRange {
	start: string;
	end: string;
	reason: 'ALREADY_PAID';
	payrollId?: number;
}

/** One student's contribution to a PERCENT payroll gross. */
export interface PercentPayrollLine {
	groupId: number;
	groupName: string;
	enrollmentId: number;
	studentId: number;
	studentName: string;
	feePlanId: number;
	feePlanAmount: number;
	billingCycle: 'MONTHLY' | 'PER_SESSION';
	sessionsCounted: number;
	sessionsTotal: number;
	earnings: number;
	amount: number;
}

/** Legacy/FIXED breakdown — rows without a `type` are FIXED. */
export interface FixedPayrollBreakdown {
	type?: 'FIXED';
	hoursTaught?: number;
	rate?: number;
	bonuses?: number;
	/** Set only when a FULL_TIME salary was prorated around already-paid days. */
	proratedFactor?: number;
	skippedRanges?: PayrollSkippedRange[];
}

/** Server-computed breakdown for PERCENT-paid teachers. */
export interface PercentPayrollBreakdown {
	type: 'PERCENT';
	percent: number;
	lines: PercentPayrollLine[];
	bonuses?: number;
	skippedRanges?: PayrollSkippedRange[];
}

export type PayrollBreakdown = FixedPayrollBreakdown | PercentPayrollBreakdown;

/** `GET /payrolls/preview` — dry-run of create; nothing is written. */
export interface PayrollPreviewResponse {
	staffId: number;
	payrollType: 'FIXED' | 'PERCENT';
	periodStart: string;
	periodEnd: string;
	/** Every day already covered by live payrolls — creation would 409. */
	fullyCovered: boolean;
	grossAmount: number;
	breakdown: PayrollBreakdown | null;
	skippedRanges: PayrollSkippedRange[];
}

/** `GET /payrolls/summary` — true aggregate over every matching payroll (not just a page). */
export interface PayrollSummaryResponse {
	currency: string;
	totalGross: number;
	totalDeductions: number;
	totalNetPayable: number;
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
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// still wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: PayrollListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: payrollKeys.list(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<PayrollResponse>('/payrolls', {
				params: effectiveFilters,
			}) as Promise<PaginatedResult<PayrollResponse>>,
		placeholderData: keepPreviousData,
	});
}

/**
 * Totals for the summary strip above the payroll list — the same filters as
 * the list (branch scope, status, staff, period), minus pagination, so the
 * strip reads as "totals for what's on screen".
 */
export function usePayrollSummary(filters: PayrollSummaryFilters = {}) {
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: PayrollSummaryFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: payrollKeys.summary(effectiveFilters),
		queryFn: () =>
			manageApi.get<PayrollSummaryResponse>('/payrolls/summary', {
				params: effectiveFilters,
			}),
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

/**
 * Dry-run of `POST /payrolls` for the create form: the would-be gross, the
 * per-student lines (PERCENT) and any already-paid days that will be skipped.
 * Enabled only once staff + a valid period are chosen.
 */
export function usePayrollPreview(
	params: { staffId?: number; periodStart?: string; periodEnd?: string },
	enabled: boolean,
) {
	return useQuery({
		queryKey: payrollKeys.preview(params),
		queryFn: () =>
			manageApi.get<PayrollPreviewResponse>('/payrolls/preview', { params }),
		enabled,
		placeholderData: keepPreviousData,
	});
}
