import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { expensesKeys } from '@/features/expenses/api/keys';

import { payrollKeys } from './keys';
import type { PayrollAdvance, PayrollStaffPeriodResponse } from './payroll.queries';

// Money-critical: no optimistic updates anywhere here — every figure the UI
// shows after a mutation comes from the server's confirmed response/refetch.

// ─── Input types ─────────────────────────────────────────────────────────────

export interface FinalizePeriodInput {
	month: string;
	branchId?: number;
}

/** `POST /payrolls/finalize` result. */
export interface FinalizePeriodResult {
	finalized: number;
	/** Rows already finalized (or otherwise not finalizable) this month. */
	skipped: number;
	payrollIds: number[];
}

export interface CreateAdvanceInput {
	staffId: number;
	branchId: number;
	amount: number;
	label?: string;
	advanceDate: string;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Freeze the month into snapshots. Also touches the expenses feature: the
 * backend records finalized payroll as SALARY expenses, so its caches are
 * invalidated alongside payroll's.
 */
export function useFinalizePeriod() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: FinalizePeriodInput) =>
			manageApi.post<FinalizePeriodResult>('/payrolls/finalize', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: payrollKeys.all });
			void qc.invalidateQueries({ queryKey: expensesKeys.all });
		},
	});
}

/** Discard a finalized snapshot — the row goes back to LIVE recomputation. */
export function useUnfinalizePayroll(id: number) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => manageApi.post<void>(`/payrolls/${id}/unfinalize`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: payrollKeys.all });
			void qc.invalidateQueries({ queryKey: expensesKeys.all });
		},
	});
}

/** Mark a finalized snapshot paid (creates the SALARY expense server-side). */
export function useMarkPayrollPaid(id: number) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () =>
			manageApi.post<PayrollStaffPeriodResponse>(`/payrolls/${id}/mark-paid`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: payrollKeys.all });
			void qc.invalidateQueries({ queryKey: expensesKeys.all });
		},
	});
}

/** Record a mid-month advance — remembered and deducted from net. */
export function useCreateAdvance() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateAdvanceInput) =>
			manageApi.post<PayrollAdvance>('/payrolls/advances', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: payrollKeys.all });
			void qc.invalidateQueries({ queryKey: expensesKeys.all });
		},
	});
}

/** Remove an advance (only while `removable` and the period is not finalized). */
export function useRemoveAdvance() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => manageApi.delete(`/payrolls/advances/${id}`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: payrollKeys.all });
			void qc.invalidateQueries({ queryKey: expensesKeys.all });
		},
	});
}
