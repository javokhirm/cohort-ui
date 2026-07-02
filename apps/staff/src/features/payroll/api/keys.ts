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

export const payrollKeys = {
	all: ['payroll'] as const,

	list: (filters: PayrollListFilters) => [...payrollKeys.all, 'list', filters] as const,
	detail: (id: number) => [...payrollKeys.all, 'detail', id] as const,
};
