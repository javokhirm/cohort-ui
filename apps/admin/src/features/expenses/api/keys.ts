export type ExpenseCategoryFilter =
	'RENT' | 'UTILITIES' | 'MARKETING' | 'SALARY' | 'OTHER';

export interface ExpenseListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	category?: ExpenseCategoryFilter;
	from?: string;
	to?: string;
}

/** `GET /manage/expenses/summary` takes the same filters minus pagination. */
export type ExpenseSummaryFilters = Omit<ExpenseListFilters, 'page' | 'limit'>;

export const expensesKeys = {
	all: ['expenses'] as const,

	expenses: () => [...expensesKeys.all, 'expense'] as const,
	expenseList: (filters: ExpenseListFilters) =>
		[...expensesKeys.expenses(), 'list', filters] as const,
	expenseSummary: (filters: ExpenseSummaryFilters) =>
		[...expensesKeys.expenses(), 'summary', filters] as const,
};
