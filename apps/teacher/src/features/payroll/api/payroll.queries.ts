import { useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

/**
 * The teacher's own payroll (`GET /teach/payroll`, api-reference §4.9). The
 * server derives the staff member from the JWT, so there is no id to pass and
 * no way to read someone else's figures.
 *
 * Hand-mirrored from the backend's staff-period DTO: the teach controllers
 * declare no `@ApiOkResponse`, so the OpenAPI document carries no response
 * schema to generate from.
 */

/** Whether the month is still recomputing, frozen, or settled. */
export type MyPayrollStatus = 'LIVE' | 'FINALIZED' | 'PAID';

/** How the month was priced. */
export type MyPayrollRateType = 'FIXED' | 'HOURLY' | 'PERCENT';

/** One pay-config window that applied during the month. */
export interface MyPayrollSegment {
	payrollConfigId: number;
	payrollType: 'FIXED' | 'PERCENT';
	baseSalary: number | null;
	payrollPercent: number | null;
	from: string;
	to: string;
}

/** The server-computed inputs behind the gross figure. */
export interface MyPayrollCalculation {
	percent: number | null;
	baseSalary: number | null;
	hourlyRate: number | null;
	sessionsTaught: number;
	hoursTaught: number;
	studentsCount: number;
	revenueBaseTotalExact: number | null;
	prorationFactor: number | null;
	/** Full-precision gross, before banker's rounding. */
	grossExact: number;
	gross: number;
	rounding: 'BANKERS_2DP';
}

/** One student's line — the money split for revenue-share teachers. */
export interface MyPayrollLine {
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
	prorationFactor: number | null;
	hours: number;
	revenueBaseExact: number;
	revenueBase: number;
	/** Null on audit-only lines (fixed/hourly teachers). */
	shareExact: number | null;
	share: number | null;
}

/** A mid-month advance already drawn against this month's pay. */
export interface MyPayrollAdvance {
	id: number;
	staffId: number;
	branchId: number;
	amount: number;
	label: string | null;
	advanceDate: string;
	payrollId: number | null;
	removable: boolean;
	createdAt: string;
}

/** `GET /teach/payroll?month=` — one month in full. */
export interface MyPayrollMonth {
	month: string;
	periodStart: string;
	periodEnd: string;
	staffId: number;
	staffCode: string;
	staffName: string;
	position: string | null;
	branchId: number;
	status: MyPayrollStatus;
	rateType: MyPayrollRateType;
	grossAmount: number;
	advancesTotal: number;
	netAmount: number;
	/** Net was clamped to 0 — the advances exceed the computed pay. */
	advancesExceedGross: boolean;
	breakdown: {
		version: 2;
		rateType: MyPayrollRateType;
		segments: MyPayrollSegment[];
		calculation: MyPayrollCalculation;
		lines: MyPayrollLine[];
	};
	advances: MyPayrollAdvance[];
	payrollId: number | null;
	finalizedAt: string | null;
	finalizedByName: string | null;
	paidAt: string | null;
}

/** `GET /teach/payroll/periods` — the month picker's options. */
export interface MyPayrollPeriod {
	month: string;
	periodStart: string;
	periodEnd: string;
	status: MyPayrollStatus;
	grossAmount: number;
	advancesTotal: number;
	netAmount: number;
	payrollId: number | null;
}

export const myPayrollKeys = {
	all: ['my-payroll'] as const,
	periods: () => [...myPayrollKeys.all, 'periods'] as const,
	month: (month: string) => [...myPayrollKeys.all, 'month', month] as const,
};

/**
 * The recent months — finalized snapshots plus the current month while it is
 * still live. Drives the month picker.
 */
export function useMyPayrollPeriods(limit = 12) {
	return useQuery({
		queryKey: myPayrollKeys.periods(),
		queryFn: () =>
			teachApi.get<MyPayrollPeriod[]>('/payroll/periods', { params: { limit } }),
	});
}

/**
 * One month's detail. Live months are recomputed from completed sessions on
 * every load, so this never serves stale figures.
 */
export function useMyPayroll(month: string) {
	return useQuery({
		queryKey: myPayrollKeys.month(month),
		queryFn: () => teachApi.get<MyPayrollMonth>('/payroll', { params: { month } }),
		enabled: month.length > 0,
		staleTime: 0,
	});
}
