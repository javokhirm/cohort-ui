import { z } from 'zod';

import { RECORDABLE_PAYMENT_METHODS } from '../api/invoices.queries';

export const recordPaymentSchema = z.object({
	amount: z
		.number({ error: 'Amount is required' })
		.positive('Amount must be greater than 0'),
	method: z.enum(RECORDABLE_PAYMENT_METHODS),
	paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date'),
	notes: z.string().optional().or(z.literal('')),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;
