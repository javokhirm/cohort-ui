/**
 * The platform → tenant subscription invoice ledger (api-reference §2.3a). Each
 * row is the historical record of one purchased billing period, carrying a full
 * snapshot of what was bought (`tierName`, `unitPrice`, `billingInterval`). Those
 * are read straight off the row, never joined from the live catalogue — so a
 * later rename or re-price can't rewrite what a tenant was historically billed.
 */

import type { BillingInterval } from '@/api/subscription-payments/types';

export const SUBSCRIPTION_INVOICE_STATUSES = [
	'PAID',
	'UNPAID',
	'FAILED',
	'REFUNDED',
] as const;
export type SubscriptionInvoiceStatus = (typeof SUBSCRIPTION_INVOICE_STATUSES)[number];

export interface SubscriptionInvoiceView {
	id: number;
	tenantId: number;
	subscriptionId: number;
	/** Globally unique code (`SUB-2026-00042`). */
	code: string;
	/** Snapshot of the tier name at purchase time — not the live catalogue name. */
	tierName: string;
	subscriptionTierId: number;
	billingInterval: BillingInterval;
	/** Snapshot of the unit price at purchase time. */
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

export interface SubscriptionInvoiceListFilters {
	tenantId?: number;
	status?: SubscriptionInvoiceStatus;
	/** ISO date; filters on `issueDate` (inclusive). */
	from?: string;
	to?: string;
	page?: number;
	limit?: number;
}
