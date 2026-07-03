import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { expensesKeys } from './keys';
import type { ExpenseCategory, ExpenseResponse } from './expenses.queries';

// Mirrors the backend `CreateExpenseDto` / `UpdateExpenseDto` (api-reference.md §3.16).
// `receiptUrl` is intentionally omitted — no storage/upload endpoint exists yet.

export interface CreateExpenseInput {
	branchId: number;
	category: ExpenseCategory;
	amount: number;
	currency?: string;
	expenseDate: string;
	vendor?: string | null;
	description?: string | null;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
	id: number;
}

export function useCreateExpense() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateExpenseInput) =>
			manageApi.post<ExpenseResponse>('/expenses', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: expensesKeys.expenses() });
		},
	});
}

export function useUpdateExpense() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateExpenseInput) =>
			manageApi.patch<ExpenseResponse>(`/expenses/${id}`, body),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: expensesKeys.expenses() });
		},
	});
}

export function useDeleteExpense() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => manageApi.delete(`/expenses/${id}`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: expensesKeys.expenses() });
		},
	});
}
