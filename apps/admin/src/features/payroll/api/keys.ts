/** Row/status vocabulary of the period-snapshot payroll model. */
export type PayrollRowStatus = 'LIVE' | 'FINALIZED' | 'PAID';

/** How a teacher's gross is computed for the period. */
export type RateType = 'FIXED' | 'HOURLY' | 'PERCENT';

/** Whole-period state — FINALIZED once every row is snapshotted. */
export type PayrollPeriodStatus = 'OPEN' | 'PARTIALLY_FINALIZED' | 'FINALIZED';

/** `GET /payrolls/period` filters (besides the `month` path of the key). */
export interface PayrollPeriodFilters {
	branchIds?: number[];
	staffId?: number;
	status?: PayrollRowStatus;
}

/** `GET /payrolls` — finalized/paid payslip history. */
export interface PayrollHistoryFilters {
	staffId?: number;
	status?: 'FINALIZED' | 'PAID';
	monthFrom?: string;
	monthTo?: string;
	page?: number;
	limit?: number;
}

/** `GET /payrolls/advances` filters. */
export interface AdvanceListFilters {
	month?: string;
	staffId?: number;
	branchIds?: number[];
}

export const payrollKeys = {
	all: ['payroll'] as const,

	/** The live/finalized period view for one month. */
	period: (month: string, filters: PayrollPeriodFilters) =>
		[...payrollKeys.all, 'period', month, filters] as const,
	/** One staff member's period detail (breakdown + advances) for a month. */
	periodDetail: (month: string, staffId: number) =>
		[...payrollKeys.all, 'period', month, 'staff', staffId] as const,
	/** Finalized/paid payslip history (paginated). */
	history: (filters: PayrollHistoryFilters) =>
		[...payrollKeys.all, 'history', filters] as const,
	/** A finalized snapshot by payroll id (deep link). */
	detail: (id: number) => [...payrollKeys.all, 'detail', id] as const,
	/** Mid-month advances. */
	advances: (filters: AdvanceListFilters) =>
		[...payrollKeys.all, 'advances', filters] as const,
	/** A staff member's pay-config timeline. */
	configs: (staffId: number) => [...payrollKeys.all, 'configs', staffId] as const,
};
