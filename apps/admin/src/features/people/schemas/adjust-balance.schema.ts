import { z } from 'zod';

/**
 * Mirrors the backend's `AdjustWalletDto` rules so the form surfaces an inline
 * error instead of a raw 422 (`CREDIT_INSUFFICIENT_BALANCE` /
 * `WALLET_ADJUSTMENT_INVALID`): amount must be non-zero, and a negative amount
 * can't drive the balance below zero.
 */
export function adjustBalanceSchema(currentBalance: number) {
	return z.object({
		amount: z
			.number({ error: 'Amount is required' })
			.refine((v) => v !== 0, 'Amount must not be zero')
			.refine(
				(v) => v >= -currentBalance,
				'Amount cannot reduce the balance below zero',
			),
		reason: z.string().min(1, 'Reason is required'),
	});
}

export type AdjustBalanceFormValues = z.infer<ReturnType<typeof adjustBalanceSchema>>;
