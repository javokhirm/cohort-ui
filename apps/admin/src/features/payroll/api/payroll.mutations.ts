import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { payrollKeys } from './keys';
import type { PayrollBreakdown, PayrollResponse } from './payroll.queries';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreatePayrollInput {
	branchId: number;
	staffId: number;
	periodStart: string;
	periodEnd: string;
	autoCalculate?: boolean;
	grossAmount?: number;
	deductions?: number;
	breakdown?: PayrollBreakdown;
}

export interface RunPayrollInput {
	branchId?: number;
	periodStart: string;
	periodEnd: string;
	autoCalculate?: boolean;
}

export interface RunPayrollResult {
	created: number;
	/** Members whose period was already fully covered by live payrolls. */
	skipped: number;
	payrolls: PayrollResponse[];
}

export interface UpdatePayrollInput {
	id: number;
	grossAmount?: number;
	deductions?: number;
	breakdown?: PayrollBreakdown;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreatePayroll() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreatePayrollInput) =>
			manageApi.post<PayrollResponse>('/payrolls', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: payrollKeys.all });
		},
	});
}

export function useRunPayroll() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: RunPayrollInput) =>
			manageApi.post<RunPayrollResult>('/payrolls/run', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: payrollKeys.all });
		},
	});
}

export function useUpdatePayroll() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdatePayrollInput) =>
			manageApi.patch<PayrollResponse>(`/payrolls/${id}`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: payrollKeys.detail(variables.id) });
			void qc.invalidateQueries({ queryKey: payrollKeys.all });
		},
	});
}

export function useApprovePayroll() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) =>
			manageApi.post<PayrollResponse>(`/payrolls/${id}/approve`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: payrollKeys.all });
		},
	});
}

export function useMarkPayrollPaid() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) =>
			manageApi.post<PayrollResponse>(`/payrolls/${id}/mark-paid`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: payrollKeys.all });
		},
	});
}
