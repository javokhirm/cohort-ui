import { describe, expect, it } from 'vitest';

import type { InvoiceLineItem } from '../api/invoices.queries';
import type { CreditNote } from '../api/credit-notes.queries';
import { computeCreditableAmount } from './credit-notes';

function lineItem(overrides: Partial<InvoiceLineItem>): InvoiceLineItem {
	return {
		id: 1,
		description: 'Tuition',
		quantity: 1,
		unitAmount: 0,
		amount: 0,
		type: 'TUITION',
		...overrides,
	};
}

function creditNote(overrides: Partial<CreditNote>): CreditNote {
	return {
		id: 1,
		creditNoteNumber: 'CN-2026-00001',
		invoiceId: 1,
		studentId: 1,
		amount: 0,
		reason: 'test',
		createdByUserId: 1,
		createdAt: '2026-07-06T00:00:00Z',
		...overrides,
	};
}

describe('computeCreditableAmount', () => {
	it('sums every non-ADJUSTMENT line item when there are no prior credit notes', () => {
		const lineItems = [
			lineItem({ id: 1, amount: 1_300_000, type: 'TUITION' }),
			lineItem({ id: 2, amount: 50_000, type: 'LATE_FEE' }),
		];
		expect(computeCreditableAmount(lineItems, [])).toBe(1_350_000);
	});

	it('excludes ADJUSTMENT line items from the net charges', () => {
		const lineItems = [
			lineItem({ id: 1, amount: 1_300_000, type: 'TUITION' }),
			lineItem({ id: 2, amount: -100_000, type: 'ADJUSTMENT' }),
		];
		expect(computeCreditableAmount(lineItems, [])).toBe(1_300_000);
	});

	it('subtracts amounts already covered by prior credit notes', () => {
		const lineItems = [lineItem({ id: 1, amount: 1_300_000, type: 'TUITION' })];
		const creditNotes = [
			creditNote({ id: 1, amount: 300_000 }),
			creditNote({ id: 2, amount: 200_000 }),
		];
		expect(computeCreditableAmount(lineItems, creditNotes)).toBe(800_000);
	});

	it('can reach zero once fully credited', () => {
		const lineItems = [lineItem({ id: 1, amount: 500_000, type: 'TUITION' })];
		const creditNotes = [creditNote({ id: 1, amount: 500_000 })];
		expect(computeCreditableAmount(lineItems, creditNotes)).toBe(0);
	});
});
