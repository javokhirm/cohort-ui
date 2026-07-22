import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { hrKeys } from '@/features/hr/api/keys';

import { payrollKeys } from './keys';
import type { PayrollConfigResponse } from './payroll-configs.queries';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreatePayrollConfigInput {
	payrollType: 'FIXED' | 'PERCENT';
	baseSalary?: number;
	payrollPercent?: number;
	effectiveFrom: string;
}

/**
 * `payrollType` is deliberately absent: the backend pins it for the life of a
 * window (`UpdatePayrollConfigDto` has no such field, and the service reads the
 * type off the stored row). The global pipe runs `whitelist: true` without
 * `forbidNonWhitelisted`, so sending it would be silently stripped and the
 * request would report success having changed nothing. Switching FIXED ↔
 * PERCENT means opening a new window.
 */
export interface UpdatePayrollConfigInput {
	id: number;
	baseSalary?: number;
	payrollPercent?: number;
	effectiveFrom?: string;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

function invalidateConfigCaches(qc: ReturnType<typeof useQueryClient>, staffId?: number) {
	// Pay-model changes ripple into every live period figure.
	void qc.invalidateQueries({ queryKey: payrollKeys.all });
	if (staffId != null) {
		void qc.invalidateQueries({ queryKey: payrollKeys.configs(staffId) });
		void qc.invalidateQueries({ queryKey: hrKeys.staffDetail(staffId) });
	} else {
		void qc.invalidateQueries({ queryKey: hrKeys.staff() });
	}
}

/** Open a new pay-model window from `effectiveFrom` (closes the previous one). */
export function useCreatePayrollConfig(staffId: number) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreatePayrollConfigInput) =>
			manageApi.post<PayrollConfigResponse>(
				`/staff/${staffId}/payroll-configs`,
				input,
			),
		onSuccess: () => invalidateConfigCaches(qc, staffId),
	});
}

export function useUpdatePayrollConfig() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdatePayrollConfigInput) =>
			manageApi.patch<PayrollConfigResponse>(`/payroll-configs/${id}`, body),
		onSuccess: (data) => invalidateConfigCaches(qc, data.staffId),
	});
}

/** Rejected with `PAYROLL_CONFIG_REFERENCED` once a snapshot points at it. */
export function useDeletePayrollConfig(staffId: number) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => manageApi.delete(`/payroll-configs/${id}`),
		onSuccess: () => invalidateConfigCaches(qc, staffId),
	});
}
