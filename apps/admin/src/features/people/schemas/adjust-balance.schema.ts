import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import type { useAppT } from '@/locales';

type PeopleT = ReturnType<typeof useAppT<'people'>>;

/**
 * Mirrors the backend's `AdjustWalletDto` rules so the form surfaces an inline
 * error instead of a raw 422 (`CREDIT_INSUFFICIENT_BALANCE` /
 * `WALLET_ADJUSTMENT_INVALID`): amount must be non-zero, and a negative amount
 * can't drive the balance below zero.
 */
export function adjustBalanceSchema(
	currentBalance: number,
	t: Translator<'validation'>,
	tp: PeopleT,
) {
	return z.object({
		amount: z
			.number({ error: t('required') })
			.refine((v) => v !== 0, tp('wallet.validation.amountNonZero'))
			.refine((v) => v >= -currentBalance, tp('wallet.validation.amountBelowZero')),
		reason: z.string().min(1, t('required')),
	});
}

export type AdjustBalanceFormValues = z.infer<ReturnType<typeof adjustBalanceSchema>>;
