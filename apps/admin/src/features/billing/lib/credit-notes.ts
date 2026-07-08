import type { InvoiceLineItem } from '../api/invoices.queries';
import type { CreditNote } from '../api/credit-notes.queries';

/**
 * The most a new credit note could be issued for right now. The backend has
 * no endpoint field for this (only a 422 `CREDIT_NOTE_EXCEEDS_INVOICE` if you
 * overshoot it), so it's computed client-side from data already on the
 * invoice detail response: net charges (every line item except manual
 * `ADJUSTMENT`s) minus whatever's already been credited.
 */
export function computeCreditableAmount(
	lineItems: InvoiceLineItem[],
	creditNotes: CreditNote[],
): number {
	const netCharges = lineItems
		.filter((li) => li.type !== 'ADJUSTMENT')
		.reduce((sum, li) => sum + li.amount, 0);
	const alreadyCredited = creditNotes.reduce((sum, cn) => sum + cn.amount, 0);
	return netCharges - alreadyCredited;
}
