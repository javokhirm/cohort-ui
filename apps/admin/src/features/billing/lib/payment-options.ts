import type { PaymentMethod, PaymentStatus } from '../api/invoices.queries';

/**
 * Payment option tables — **values only, never display text** (conventions.md
 * §7). Statuses resolve through `useStatusLabel('payment', …)`; methods resolve
 * against the app catalog's `billing.paymentMethod.*`.
 */

/** Status filter chips for the payment list toolbar (maps to `?status=`). */
export const PAYMENT_STATUS_FILTERS: { value: PaymentStatus | undefined }[] = [
	{ value: undefined },
	{ value: 'PENDING' },
	{ value: 'SUCCEEDED' },
	{ value: 'FAILED' },
	{ value: 'REFUNDED' },
];

/** Every method a payment can report, for the method filter select (maps to `?method=`). */
export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod }[] = [
	{ value: 'CASH' },
	{ value: 'CLICK' },
	{ value: 'PAYME' },
	{ value: 'UZUM' },
	{ value: 'CARD' },
	{ value: 'BANK_TRANSFER' },
	{ value: 'CREDIT' },
];
