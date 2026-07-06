import { z } from 'zod';

/**
 * Mirrors the backend's `CreateCreditNoteDto` rules, plus the client-computed
 * creditable cap (see `lib/credit-notes.ts`), so an over-large amount surfaces
 * an inline error instead of a raw 422 `CREDIT_NOTE_EXCEEDS_INVOICE`.
 */
export function creditNoteSchema(maxAmount: number) {
	return z.object({
		amount: z
			.number({ error: 'Amount is required' })
			.positive('Amount must be greater than 0')
			.max(maxAmount, `Amount cannot exceed ${maxAmount}`),
		reason: z.string().min(1, 'Reason is required'),
	});
}

export type CreditNoteFormValues = z.infer<ReturnType<typeof creditNoteSchema>>;
