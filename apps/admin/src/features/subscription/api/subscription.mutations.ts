import { useMutation, useQueryClient } from '@tanstack/react-query';

import { subscriptionKeys, type BillingInterval } from '@repo/api-client';

import { manageApi } from '@/api/apiClient';

/**
 * The only method this console ever sends. The backend accepts `CLICK`,
 * `UZUM`, `BANK_TRANSFER` and `CASH` too, but a center pays for its own
 * subscription through Payme and nothing else — the offline methods are
 * Super Admin's to settle. Pinning the literal here, at the one call site,
 * is what keeps it out of the UI as a choice the admin could get wrong.
 */
const PAYMENT_METHOD = 'PAYME';

export type SubscriptionInvoiceStatus = 'PAID' | 'UNPAID' | 'FAILED' | 'REFUNDED';
export type SubscriptionPaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
export type SubscriptionPaymentMethod =
	'CLICK' | 'PAYME' | 'UZUM' | 'BANK_TRANSFER' | 'CASH';

/** The renewal invoice `POST /subscription/renew` issues — one purchased billing period. */
export interface SubscriptionInvoice {
	id: number;
	code: string;
	tierName: string;
	subscriptionTierId: number;
	billingInterval: BillingInterval;
	unitPrice: number;
	amount: number;
	currency: string;
	status: SubscriptionInvoiceStatus;
	issueDate: string;
	periodStart: string;
	periodEnd: string;
	paidAt: string | null;
	createdAt: string;
}

/** The `PENDING` payment issued alongside it; `amount` is the full invoice amount. */
export interface SubscriptionPayment {
	id: number;
	subscriptionInvoiceId: number | null;
	invoiceCode: string | null;
	amount: number;
	currency: string;
	method: SubscriptionPaymentMethod;
	provider: string | null;
	providerTxnId: string | null;
	status: SubscriptionPaymentStatus;
	paidAt: string | null;
	failureReason: string | null;
	refundedAt: string | null;
	refundedAmount: number | null;
	createdAt: string;
}

/**
 * Payme's POST-redirect checkout: render `fields` as hidden inputs and submit
 * to `action` (cohort-be api-reference §1.2). Preferred over `checkoutUrl`
 * because only the form carries the fiscal `detail` Payme prints the receipt
 * from — Payme's GET parameter set has nowhere to put it.
 */
export interface PaymeCheckoutForm {
	action: string;
	method: 'POST';
	fields: Record<string, string>;
}

/**
 * What the admin is buying. There is no `amount` and no `method`: the server
 * prices the invoice and this app always settles through Payme, so the only
 * choice reaching the API is which plan and cadence to renew onto.
 */
export interface RenewSubscriptionInput {
	/** Omit to renew the current plan unchanged. */
	subscriptionTierId?: number;
	/** Omit to keep the subscription's current interval. */
	billingInterval?: BillingInterval;
}

export interface RenewSubscriptionResult {
	invoice: SubscriptionInvoice;
	payment: SubscriptionPayment;
	/** The settlement webhook's lookup key — travels to Payme as the checkout's `order_id`. */
	idempotencyKey: string;
	/** Payme's hosted-checkout GET link, or `null` when Payme is not configured for the deployment. */
	checkoutUrl: string | null;
	/** The equivalent POST form. Populated and `null` together with `checkoutUrl`. */
	checkoutForm: PaymeCheckoutForm | null;
}

/**
 * `POST /manage/subscription/renew` — issues a renewal invoice and its pending
 * payment, plus the Payme checkout to settle it with. **Access does not change
 * here**: the period only moves once Payme's Merchant API settles the payment
 * server-side, so this never touches the session store's `subscription` — the
 * caller waits for a fresh read of `useSubscription` instead (§5, never
 * optimistic).
 */
export function useRenewSubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: RenewSubscriptionInput) =>
			manageApi.post<RenewSubscriptionResult>('/subscription/renew', {
				...input,
				method: PAYMENT_METHOD,
			}),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: subscriptionKeys.all });
		},
	});
}
