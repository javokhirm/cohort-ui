import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import { WALLET_DEPOSIT_METHODS } from '../api/wallet.mutations';

/** A factory — user-facing messages must resolve at render (conventions.md §7). */
export function depositSchema(t: Translator<'validation'>) {
	return z.object({
		amount: z.number({ error: t('required') }).positive(t('amountPositive')),
		method: z.enum(WALLET_DEPOSIT_METHODS),
		notes: z.string().optional().or(z.literal('')),
	});
}

export type DepositFormValues = z.infer<ReturnType<typeof depositSchema>>;
