export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID';

export interface PayrollListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	staffId?: number;
	status?: PayrollStatus;
	periodFrom?: string;
	periodTo?: string;
}

/** `GET /payrolls/summary` filters — the list filters, without pagination. */
export type PayrollSummaryFilters = Omit<PayrollListFilters, 'page' | 'limit'>;

export const payrollKeys = {
	all: ['payroll'] as const,

	list: (filters: PayrollListFilters) => [...payrollKeys.all, 'list', filters] as const,
	summary: (filters: PayrollSummaryFilters) =>
		[...payrollKeys.all, 'summary', filters] as const,
	detail: (id: number) => [...payrollKeys.all, 'detail', id] as const,
	preview: (params: { staffId?: number; periodStart?: string; periodEnd?: string }) =>
		[...payrollKeys.all, 'preview', params] as const,
};
