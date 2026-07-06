import { z } from 'zod';

import { WALLET_DEPOSIT_METHODS } from '../api/wallet.mutations';

export const depositSchema = z.object({
	amount: z
		.number({ error: 'Amount is required' })
		.positive('Amount must be greater than 0'),
	method: z.enum(WALLET_DEPOSIT_METHODS),
	notes: z.string().optional().or(z.literal('')),
});

export type DepositFormValues = z.infer<typeof depositSchema>;
