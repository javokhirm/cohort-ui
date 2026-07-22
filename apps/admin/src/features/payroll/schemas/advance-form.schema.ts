import { z } from 'zod';

/**
 * Inline "record an advance" form on the payroll detail page. Mirrors
 * `POST /payrolls/advances` — amount is required and positive; the label is a
 * free-text reason the payslip shows back; the date defaults to today.
 */
export const advanceFormSchema = z.object({
	label: z.string().max(120, 'Keep the reason under 120 characters').optional(),
	amount: z
		.number({ error: 'Amount is required' })
		.positive('Amount must be greater than 0'),
	advanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
});

export type AdvanceFormValues = z.infer<typeof advanceFormSchema>;
