import { z } from 'zod';

import { EXPENSE_CATEGORIES } from '../api/expenses.queries';

/** Calendar date, no time component (api-reference.md → Conventions: `YYYY-MM-DD`). */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const expenseFormSchema = z.object({
	category: z.enum(EXPENSE_CATEGORIES),
	branchId: z.number({ error: 'Branch is required' }).int().positive(),
	amount: z
		.number({ error: 'Amount is required' })
		.positive('Amount must be greater than 0'),
	expenseDate: z.string().regex(ISO_DATE, 'Use a valid date'),
	vendor: z.string().optional().or(z.literal('')),
	description: z.string().optional().or(z.literal('')),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

/** Blank string in an optional text field → `null` payload. */
export function blankToNull(value: string | undefined): string | null | undefined {
	return value === '' ? null : value;
}
