import type { ExpenseCategory } from '../api/expenses.queries';

export const EXPENSE_CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
	{ value: 'RENT', label: 'Rent' },
	{ value: 'UTILITIES', label: 'Utilities' },
	{ value: 'MARKETING', label: 'Marketing' },
	{ value: 'SALARY', label: 'Salary' },
	{ value: 'OTHER', label: 'Other' },
];

/** Category filter chips for the expense list toolbar (maps to `?category=`). */
export const EXPENSE_CATEGORY_FILTERS: {
	value: ExpenseCategory | undefined;
	label: string;
}[] = [{ value: undefined, label: 'All' }, ...EXPENSE_CATEGORY_OPTIONS];

export function expenseCategoryLabel(category: ExpenseCategory): string {
	return EXPENSE_CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? category;
}
