import type { PaymentMethod, PaymentStatus } from '../api/invoices.queries';

/** Status filter chips for the payment list toolbar (maps to `?status=`). */
export const PAYMENT_STATUS_FILTERS: {
	value: PaymentStatus | undefined;
	label: string;
}[] = [
	{ value: undefined, label: 'All' },
	{ value: 'PENDING', label: 'Pending' },
	{ value: 'SUCCEEDED', label: 'Succeeded' },
	{ value: 'FAILED', label: 'Failed' },
	{ value: 'REFUNDED', label: 'Refunded' },
];

/** Every method a payment can report, for the method filter select (maps to `?method=`). */
export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
	{ value: 'CASH', label: 'Cash' },
	{ value: 'CLICK', label: 'Click' },
	{ value: 'PAYME', label: 'Payme' },
	{ value: 'UZUM', label: 'Uzum' },
	{ value: 'CARD', label: 'Card' },
	{ value: 'BANK_TRANSFER', label: 'Bank transfer' },
];

export function paymentMethodLabel(method: PaymentMethod): string {
	return PAYMENT_METHOD_OPTIONS.find((o) => o.value === method)?.label ?? method;
}
