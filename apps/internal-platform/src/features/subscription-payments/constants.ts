import type { StatusTone } from '@repo/ui';

import {
	SUBSCRIPTION_PAYMENT_METHODS,
	SUBSCRIPTION_PAYMENT_STATUSES,
	type SubscriptionPaymentMethod,
	type SubscriptionPaymentStatus,
} from '@/api/subscription-payments/types';
import type { useAppT } from '@/locales';

export const PAGE_SIZE = 20;

/** Payment-status → badge tone. Refunds read violet, distinct from a hard failure. */
export const PAYMENT_STATUS_TONE: Record<SubscriptionPaymentStatus, StatusTone> = {
	PENDING: 'amber',
	SUCCEEDED: 'green',
	FAILED: 'red',
	REFUNDED: 'violet',
};

export function paymentStatusLabel(
	t: ReturnType<typeof useAppT<'payments'>>,
	status: SubscriptionPaymentStatus,
): string {
	switch (status) {
		case 'PENDING':
			return t('status.pending');
		case 'SUCCEEDED':
			return t('status.succeeded');
		case 'FAILED':
			return t('status.failed');
		case 'REFUNDED':
			return t('status.refunded');
	}
}

export function paymentMethodLabel(
	t: ReturnType<typeof useAppT<'payments'>>,
	method: SubscriptionPaymentMethod,
): string {
	switch (method) {
		case 'CLICK':
			return t('method.click');
		case 'PAYME':
			return t('method.payme');
		case 'UZUM':
			return t('method.uzum');
		case 'BANK_TRANSFER':
			return t('method.bankTransfer');
		case 'CASH':
			return t('method.cash');
	}
}

/** Status filter options, `all` first. */
export function buildStatusOptions(
	t: ReturnType<typeof useAppT<'payments'>>,
): { value: SubscriptionPaymentStatus | 'all'; label: string }[] {
	return [
		{ value: 'all', label: t('filter.allStatuses') },
		...SUBSCRIPTION_PAYMENT_STATUSES.map((s) => ({
			value: s,
			label: paymentStatusLabel(t, s),
		})),
	];
}

/** Method filter options, `all` first. */
export function buildMethodOptions(
	t: ReturnType<typeof useAppT<'payments'>>,
): { value: SubscriptionPaymentMethod | 'all'; label: string }[] {
	return [
		{ value: 'all', label: t('filter.allMethods') },
		...SUBSCRIPTION_PAYMENT_METHODS.map((m) => ({
			value: m,
			label: paymentMethodLabel(t, m),
		})),
	];
}
