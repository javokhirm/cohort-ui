import type {
	ClientSettableInvoiceLineItemType,
	InvoiceStatus,
	RecordablePaymentMethod,
} from '../api/invoices.queries';

/**
 * Invoice option tables — **values only, never display text**. A label captured
 * at module load would freeze in whatever language was active when the module
 * first evaluated (conventions.md §7).
 *
 * Statuses resolve through `useStatusLabel('invoice', …)`, which reads the same
 * `enums.domain.invoice.*` catalog `@repo/ui` colors against; methods and line
 * item types resolve against the app's `billing` namespace.
 */

/**
 * Status filter chips for the invoice list toolbar (maps to `?status=`).
 *
 * Ordered by how often an admin reaches for them — what's owed first, then
 * what's settled, then the two states that carry no money (`DRAFT` not yet
 * issued, `VOID` cancelled). `VOID` is included because the list shows void
 * invoices in every other tab: without a chip they can only be read mixed into
 * "All", never isolated.
 */
export const INVOICE_STATUS_FILTERS: { value: InvoiceStatus | undefined }[] = [
	{ value: undefined },
	{ value: 'UNPAID' },
	{ value: 'PARTIAL' },
	{ value: 'OVERDUE' },
	{ value: 'PAID' },
	{ value: 'DRAFT' },
	{ value: 'VOID' },
];

/** Method choices for the Record Payment form — only what `POST /invoices/:id/payments` accepts. */
export const RECORDABLE_PAYMENT_METHOD_OPTIONS: {
	value: RecordablePaymentMethod;
}[] = [{ value: 'CASH' }, { value: 'CARD' }, { value: 'BANK_TRANSFER' }];

/** Type choices for line items on the create-invoice form — only what's client-settable. */
export const INVOICE_LINE_ITEM_TYPE_OPTIONS: {
	value: ClientSettableInvoiceLineItemType;
}[] = [{ value: 'TUITION' }, { value: 'OTHER' }];
