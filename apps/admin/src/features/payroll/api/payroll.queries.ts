import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import {
	payrollKeys,
	type AdvanceListFilters,
	type PayrollHistoryFilters,
	type PayrollPeriodFilters,
	type PayrollPeriodStatus,
	type PayrollRowStatus,
	type RateType,
} from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Hand-written to match the backend contract for the period-snapshot payroll
// endpoints (api-reference §3.17), mirroring the generated OpenAPI shapes.

/** One teacher's row in the period view (`GET /payrolls/period`). */
export interface PayrollPeriodRow {
	staffId: number;
	staffCode: string;
	staffName: string;
	position: string | null;
	branchId: number;
	rateType: RateType;
	/** Revenue-share percentage; set only for `PERCENT` teachers. */
	percent: number | null;
	sessionsTaught: number;
	studentsCount: number;
	hoursTaught: number;
	grossAmount: number;
	advancesTotal: number;
	netAmount: number;
	/** Net was clamped to 0 — advances exceed the computed gross. */
	advancesExceedGross: boolean;
	status: PayrollRowStatus;
	/** Set once the row is finalized into a snapshot. */
	payrollId: number | null;
	finalizedAt: string | null;
	paidAt: string | null;
}

export interface PayrollPeriodSummary {
	currency: string;
	totalComputed: number;
	totalAdvances: number;
	totalNetPayable: number;
	staffCount: number;
}

/** `GET /payrolls/period` — the whole month, computed on each load. */
export interface PayrollPeriodResponse {
	month: string;
	periodStart: string;
	periodEnd: string;
	periodStatus: PayrollPeriodStatus;
	summary: PayrollPeriodSummary;
	rows: PayrollPeriodRow[];
	/** Staff with no active payroll config this month (not in `rows`). */
	excludedCount: number;
}

/** One pay-config window that applied during the period. */
export interface PayrollBreakdownSegment {
	payrollConfigId: number;
	payrollType: 'FIXED' | 'PERCENT';
	baseSalary: number | null;
	payrollPercent: number | null;
	from: string;
	to: string;
}

/** Server-computed inputs of the gross figure (breakdown v2). */
export interface PayrollCalculation {
	percent: number | null;
	baseSalary: number | null;
	hourlyRate: number | null;
	sessionsTaught: number;
	hoursTaught: number;
	studentsCount: number;
	/** Full-precision prorated revenue base; null for FIXED/HOURLY. */
	revenueBaseTotalExact: number | null;
	/** Paid-days factor when configs cover only part of the month; null otherwise. */
	prorationFactor: number | null;
	/** Full-precision gross before rounding. */
	grossExact: number;
	gross: number;
	rounding: 'BANKERS_2DP';
}

/** One student's audit line in the breakdown. */
export interface PayrollBreakdownLine {
	groupId: number;
	groupName: string;
	enrollmentId: number;
	studentId: number;
	studentName: string;
	feePlanId: number | null;
	feePlanAmount: number | null;
	billingCycle: 'MONTHLY' | 'PER_SESSION' | null;
	monthlyTuition: number | null;
	sessionsTaught: number;
	/** The group's classes for the month, any status (the denominator). */
	sessionsTotalPlanned: number;
	/** `sessionsTaught / sessionsTotalPlanned`; null for PER_SESSION plans. */
	prorationFactor: number | null;
	hours: number;
	revenueBaseExact: number;
	revenueBase: number;
	/** The teacher's cut; null on audit-only lines (FIXED/HOURLY teachers). */
	shareExact: number | null;
	share: number | null;
}

export interface PayrollBreakdown {
	version: 2;
	rateType: RateType;
	segments: PayrollBreakdownSegment[];
	calculation: PayrollCalculation;
	lines: PayrollBreakdownLine[];
}

/** A mid-month advance (salary drawn before the run). */
export interface PayrollAdvance {
	id: number;
	staffId: number;
	branchId: number;
	amount: number;
	label: string | null;
	advanceDate: string;
	/** Set once the advance is locked into a finalized snapshot. */
	payrollId: number | null;
	removable: boolean;
	createdAt: string;
}

/**
 * One staff member's full period figure — `GET /payrolls/period/:staffId`,
 * `GET /payrolls/:id`, and the `mark-paid` response all share this shape.
 */
export interface PayrollStaffPeriodResponse {
	month: string;
	periodStart: string;
	periodEnd: string;
	staffId: number;
	staffCode: string;
	staffName: string;
	position: string | null;
	branchId: number;
	status: PayrollRowStatus;
	rateType: RateType;
	grossAmount: number;
	advancesTotal: number;
	netAmount: number;
	advancesExceedGross: boolean;
	breakdown: PayrollBreakdown;
	advances: PayrollAdvance[];
	payrollId: number | null;
	finalizedAt: string | null;
	finalizedByName: string | null;
	paidAt: string | null;
}

/** `GET /payrolls` row — finalized/paid payslip history. */
export interface PayrollHistoryRow {
	id: number;
	staffId: number;
	staffCode: string;
	staffName: string;
	branchId: number;
	month: string;
	periodStart: string;
	periodEnd: string;
	grossAmount: number;
	deductions: number;
	netAmount: number;
	status: 'FINALIZED' | 'PAID';
	finalizedAt: string | null;
	paidAt: string | null;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * The period view for a month — computed on each load so live rows track
 * completed sessions: `staleTime: 0` + refetch on focus, with the previous
 * month's rows held as placeholder while stepping periods.
 *
 * The global branch selection is part of the effective filters (and thus the
 * query key), so changing the selector refetches. An explicit caller value
 * still wins.
 */
export function usePayrollPeriod(month: string, filters: PayrollPeriodFilters = {}) {
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: PayrollPeriodFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: payrollKeys.period(month, effectiveFilters),
		queryFn: () =>
			manageApi.get<PayrollPeriodResponse>('/payrolls/period', {
				params: { month, ...effectiveFilters },
			}),
		enabled: month.length > 0,
		staleTime: 0,
		refetchOnWindowFocus: true,
		placeholderData: keepPreviousData,
	});
}

/**
 * One staff member's live/snapshot figure for a month — the detail page.
 * Same freshness policy as the period list: live rows recompute on each load.
 */
export function usePayrollStaffPeriod(month: string, staffId: number) {
	return useQuery({
		queryKey: payrollKeys.periodDetail(month, staffId),
		queryFn: () =>
			manageApi.get<PayrollStaffPeriodResponse>(`/payrolls/period/${staffId}`, {
				params: { month },
			}),
		enabled: month.length > 0 && staffId > 0,
		staleTime: 0,
		refetchOnWindowFocus: true,
	});
}

/** Finalized/paid payslip history (e.g. the staff detail Payroll tab). */
export function usePayrollHistory(filters: PayrollHistoryFilters = {}) {
	return useQuery({
		queryKey: payrollKeys.history(filters),
		queryFn: () =>
			manageApi.getPaginated<PayrollHistoryRow>('/payrolls', {
				params: filters,
			}) as Promise<PaginatedResult<PayrollHistoryRow>>,
		placeholderData: keepPreviousData,
	});
}

/** A finalized snapshot by payroll id (deep links from history/expenses). */
export function usePayroll(id: number) {
	return useQuery({
		queryKey: payrollKeys.detail(id),
		queryFn: () => manageApi.get<PayrollStaffPeriodResponse>(`/payrolls/${id}`),
		enabled: id > 0,
	});
}

/** Mid-month advances for a filter window (list/reporting use). */
export function usePayrollAdvances(filters: AdvanceListFilters = {}) {
	return useQuery({
		queryKey: payrollKeys.advances(filters),
		queryFn: () =>
			manageApi.get<PayrollAdvance[]>('/payrolls/advances', { params: filters }),
	});
}
