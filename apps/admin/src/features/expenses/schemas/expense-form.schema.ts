import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import { EXPENSE_CATEGORIES } from '../api/expenses.queries';

/** Calendar date, no time component (api-reference.md → Conventions: `YYYY-MM-DD`). */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A factory, not a constant — the messages are user-facing, so they must resolve
 * at render rather than at module load (conventions.md §7). Callers memoise on
 * the translator.
 */
export function expenseFormSchema(t: Translator<'validation'>) {
	return z.object({
		category: z.enum(EXPENSE_CATEGORIES),
		branchId: z
			.number({ error: t('required') })
			.int()
			.positive(),
		amount: z.number({ error: t('required') }).positive(t('amountPositive')),
		expenseDate: z.string().regex(ISO_DATE, t('dateInvalid')),
		vendor: z.string().optional().or(z.literal('')),
		description: z.string().optional().or(z.literal('')),
	});
}

export type ExpenseFormValues = z.infer<ReturnType<typeof expenseFormSchema>>;

/** Blank string in an optional text field → `null` payload. */
export function blankToNull(value: string | undefined): string | null | undefined {
	return value === '' ? null : value;
}
