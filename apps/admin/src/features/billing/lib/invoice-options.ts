import type {
	ClientSettableInvoiceLineItemType,
	InvoiceStatus,
	RecordablePaymentMethod,
} from '../api/invoices.queries';

/** Status filter chips for the invoice list toolbar (maps to `?status=`). */
export const INVOICE_STATUS_FILTERS: {
	value: InvoiceStatus | undefined;
	label: string;
}[] = [
	{ value: undefined, label: 'All' },
	{ value: 'UNPAID', label: 'Unpaid' },
	{ value: 'PARTIAL', label: 'Partial' },
	{ value: 'PAID', label: 'Paid' },
	{ value: 'OVERDUE', label: 'Overdue' },
	{ value: 'DRAFT', label: 'Draft' },
];

/** Method choices for the Record Payment form — only what `POST /invoices/:id/payments` accepts. */
export const RECORDABLE_PAYMENT_METHOD_OPTIONS: {
	value: RecordablePaymentMethod;
	label: string;
}[] = [
	{ value: 'CASH', label: 'Cash' },
	{ value: 'CARD', label: 'Card' },
	{ value: 'BANK_TRANSFER', label: 'Bank transfer' },
];

/** Type choices for line items on the create-invoice form — only what's client-settable. */
export const INVOICE_LINE_ITEM_TYPE_OPTIONS: {
	value: ClientSettableInvoiceLineItemType;
	label: string;
}[] = [
	{ value: 'TUITION', label: 'Tuition' },
	{ value: 'OTHER', label: 'Other' },
];
