/**
 * The tenant → platform subscription payment ledger (api-reference §2.3b).
 * Deliberately separate from a tenant's *current* subscription: a center
 * accumulates many payments over its lifetime, while its subscription row only
 * ever holds the current access state.
 */

export const SUBSCRIPTION_PAYMENT_STATUSES = [
	'PENDING',
	'SUCCEEDED',
	'FAILED',
	'REFUNDED',
] as const;
export type SubscriptionPaymentStatus = (typeof SUBSCRIPTION_PAYMENT_STATUSES)[number];

export const SUBSCRIPTION_PAYMENT_METHODS = [
	'CLICK',
	'PAYME',
	'UZUM',
	'BANK_TRANSFER',
	'CASH',
] as const;
export type SubscriptionPaymentMethod = (typeof SUBSCRIPTION_PAYMENT_METHODS)[number];

/**
 * The only two methods `record-payment` accepts — online methods must settle
 * through their gateway, so the offline-settlement picker is restricted to these.
 */
export const OFFLINE_PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH'] as const;
export type OfflinePaymentMethod = (typeof OFFLINE_PAYMENT_METHODS)[number];

export type BillingInterval = 'MONTHLY' | 'ANNUAL';

export interface SubscriptionPaymentView {
	id: number;
	tenantId: number;
	subscriptionId: number;
	subscriptionInvoiceId: number;
	/** Invoice `code` this payment settles (`SUB-2026-00042`) — a support anchor. */
	invoiceCode: string | null;
	amount: number;
	currency: string;
	method: SubscriptionPaymentMethod;
	/** Gateway slug (`click`); null for offline settlements. */
	provider: string | null;
	/** Gateway transaction id — the other support anchor. */
	providerTxnId: string | null;
	status: SubscriptionPaymentStatus;
	paidAt: string | null;
	failureReason: string | null;
	refundedAt: string | null;
	refundedAmount: number | null;
	createdAt: string;
}

export interface SubscriptionPaymentListFilters {
	tenantId?: number;
	status?: SubscriptionPaymentStatus;
	method?: SubscriptionPaymentMethod;
	provider?: string;
	/** Free-text over the gateway transaction id and the invoice code. */
	search?: string;
	/** ISO date; filters on `createdAt`. */
	from?: string;
	to?: string;
	page?: number;
	limit?: number;
}

/** Body for `POST /super-admin/subscription-payments/:id/refund`. */
export interface RefundPaymentInput {
	/** Omit to refund in full; may not exceed the payment amount. */
	amount?: number;
	reason?: string;
}

/** Body for `POST /super-admin/tenants/:id/subscription/record-payment`. */
export interface RecordOfflinePaymentInput {
	method: OfflinePaymentMethod;
	/** Plan to renew onto; omit to keep the current one. */
	subscriptionTierId?: number;
	billingInterval?: BillingInterval;
	/** Bank/transfer reference, kept for the audit trail. */
	reference?: string;
}
