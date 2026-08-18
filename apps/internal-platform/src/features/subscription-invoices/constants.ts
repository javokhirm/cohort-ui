import type { StatusTone } from '@repo/ui';

import {
	SUBSCRIPTION_INVOICE_STATUSES,
	type SubscriptionInvoiceStatus,
} from '@/api/subscription-invoices/types';
import type { BillingInterval } from '@/api/subscription-payments/types';
import type { useAppT } from '@/locales';

export const PAGE_SIZE = 20;

/** Invoice-status → badge tone. */
export const INVOICE_STATUS_TONE: Record<SubscriptionInvoiceStatus, StatusTone> = {
	PAID: 'green',
	UNPAID: 'amber',
	FAILED: 'red',
	REFUNDED: 'violet',
};

export function invoiceStatusLabel(
	t: ReturnType<typeof useAppT<'invoices'>>,
	status: SubscriptionInvoiceStatus,
): string {
	switch (status) {
		case 'PAID':
			return t('status.paid');
		case 'UNPAID':
			return t('status.unpaid');
		case 'FAILED':
			return t('status.failed');
		case 'REFUNDED':
			return t('status.refunded');
	}
}

export function billingIntervalLabel(
	t: ReturnType<typeof useAppT<'invoices'>>,
	interval: BillingInterval,
): string {
	return interval === 'ANNUAL' ? t('interval.annual') : t('interval.monthly');
}

/** Status filter options, `all` first. */
export function buildStatusOptions(
	t: ReturnType<typeof useAppT<'invoices'>>,
): { value: SubscriptionInvoiceStatus | 'all'; label: string }[] {
	return [
		{ value: 'all', label: t('filter.allStatuses') },
		...SUBSCRIPTION_INVOICE_STATUSES.map((s) => ({
			value: s,
			label: invoiceStatusLabel(t, s),
		})),
	];
}
