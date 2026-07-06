import { z } from 'zod';

import { REFUND_DESTINATIONS } from '../api/payments.mutations';

export const refundPaymentSchema = z.object({
	amount: z
		.number({ error: 'Amount is required' })
		.positive('Amount must be greater than 0'),
	destination: z.enum(REFUND_DESTINATIONS),
	notes: z.string().optional().or(z.literal('')),
});

export type RefundPaymentFormValues = z.infer<typeof refundPaymentSchema>;
