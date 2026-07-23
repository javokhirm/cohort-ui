import type { ExpenseCategory } from '../api/expenses.queries';

/**
 * Expense category options — **values only, never display text**.
 *
 * The category labels live in `@repo/i18n`'s `enums.domain.expense.*`, the same
 * catalog that colors the `StatusBadge`, and are read at render through
 * `useStatusLabel('expense', category)`. Keeping labels out of this module is
 * what lets a language switch re-translate the chips (conventions.md §7).
 */
export const EXPENSE_CATEGORY_OPTIONS: { value: ExpenseCategory }[] = [
	{ value: 'RENT' },
	{ value: 'UTILITIES' },
	{ value: 'MARKETING' },
	{ value: 'SALARY' },
	{ value: 'OTHER' },
];

/** Category filter chips for the expense list toolbar (maps to `?category=`). */
export const EXPENSE_CATEGORY_FILTERS: { value: ExpenseCategory | undefined }[] = [
	{ value: undefined },
	...EXPENSE_CATEGORY_OPTIONS,
];
