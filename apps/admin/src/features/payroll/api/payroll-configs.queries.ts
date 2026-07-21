import { useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { payrollKeys } from './keys';

/**
 * One window of a staff member's pay-config timeline
 * (`GET /staff/:staffId/payroll-configs`). The open window has
 * `effectiveTo: null`; payroll periods are computed from whichever windows
 * overlap the month.
 */
export interface PayrollConfigResponse {
	id: number;
	staffId: number;
	payrollType: 'FIXED' | 'PERCENT';
	baseSalary: number | null;
	payrollPercent: number | null;
	effectiveFrom: string;
	effectiveTo: string | null;
	createdAt: string;
}

/** A staff member's pay-config timeline, newest window first. */
export function usePayrollConfigs(staffId: number) {
	return useQuery({
		queryKey: payrollKeys.configs(staffId),
		queryFn: () =>
			manageApi.get<PayrollConfigResponse[]>(`/staff/${staffId}/payroll-configs`),
		enabled: staffId > 0,
	});
}
