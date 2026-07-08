import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import {
	expensesKeys,
	type ExpenseListFilters,
	type ExpenseSummaryFilters,
} from './keys';

// Mirrors the backend operating-expense surface (api-reference.md §3.16),
// cross-checked against cohort-be src/domain/billing/entities/expense.entity.ts
// and src/api/manage/dto/expenses/*.

export const EXPENSE_CATEGORIES = [
	'RENT',
	'UTILITIES',
	'MARKETING',
	'SALARY',
	'OTHER',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** `GET /expenses` row / `POST|PATCH /expenses` response. */
export interface ExpenseResponse {
	id: number;
	branchId: number;
	category: ExpenseCategory;
	amount: number;
	currency: string;
	expenseDate: string;
	vendor: string | null;
	description: string | null;
	receiptUrl: string | null;
	recordedByUserId: number | null;
	createdAt: string;
	updatedAt: string;
}

/** `GET /expenses/summary` — true aggregate over every matching row, not a page. */
export interface ExpenseSummary {
	total: number;
	currency: string;
	byCategory: Record<ExpenseCategory, number>;
}

export function useExpenseList(filters: ExpenseListFilters) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// still wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: ExpenseListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: expensesKeys.expenseList(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<ExpenseResponse>('/expenses', {
				params: effectiveFilters,
			}) as Promise<PaginatedResult<ExpenseResponse>>,
		placeholderData: keepPreviousData,
	});
}

export function useExpenseSummary(filters: ExpenseSummaryFilters) {
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: ExpenseSummaryFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: expensesKeys.expenseSummary(effectiveFilters),
		queryFn: () =>
			manageApi.get<ExpenseSummary>('/expenses/summary', {
				params: effectiveFilters,
			}),
		placeholderData: keepPreviousData,
	});
}
