import { useEffect, useRef } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
	subscriptionKeys,
	type BillingInterval,
	type PaginatedResult,
	type SubscriptionAccessView,
} from '@repo/api-client';

import { manageApi } from '@/api/apiClient';
import { useSessionStore } from '@/store/sessionStore';

const POLL_INTERVAL_MS = 4000;

/**
 * The live access state — the same value `SubscriptionGuard` enforces. Also
 * the single writer that keeps the session store's `subscription` fresh past
 * boot, so a renewal's restored access clears the global block without a
 * page reload.
 *
 * Pass `poll: true` while waiting for a just-started renewal to settle (§5 —
 * never optimistic, only a fresh read unblocks). The stop condition lives in
 * `refetchInterval`'s function form, reading the query's own last-known data,
 * and `onAccessRestored` fires exactly once (ref-guarded) when that read
 * confirms `hasAccess` — the caller's cue to drop its own pending-payment
 * state. Neither needs a local "am I still polling" flag synced from an
 * effect.
 */
export function useSubscription(options?: {
	poll?: boolean;
	onAccessRestored?: () => void;
}) {
	const setSubscription = useSessionStore((s) => s.setSubscription);
	const shouldPoll = options?.poll ?? false;
	const onAccessRestored = options?.onAccessRestored;
	const query = useQuery({
		queryKey: subscriptionKeys.current(),
		queryFn: () => manageApi.get<SubscriptionAccessView>('/subscription'),
		refetchInterval: (q) => {
			if (!shouldPoll) return false;
			return q.state.data?.hasAccess ? false : POLL_INTERVAL_MS;
		},
	});
	const hasAccess = query.data?.hasAccess;

	useEffect(() => {
		if (query.data) setSubscription(query.data);
	}, [query.data, setSubscription]);

	const restoredRef = useRef(false);
	useEffect(() => {
		if (!shouldPoll) {
			restoredRef.current = false;
			return;
		}
		if (hasAccess && !restoredRef.current) {
			restoredRef.current = true;
			onAccessRestored?.();
		}
	}, [shouldPoll, hasAccess, onAccessRestored]);

	return query;
}

/** `GET /manage/subscription/quote` — what renewing the *current* plan/interval costs right now, without committing. */
export interface SubscriptionQuote {
	subscriptionId: number;
	subscriptionTierId: number;
	tierName: string;
	billingInterval: BillingInterval;
	amount: number;
	currency: string;
	periodStart: string;
	periodEnd: string;
	/** `true` when the current period had already lapsed, so the new one starts today instead of stacking. */
	restarted: boolean;
}

export function useSubscriptionQuote(enabled: boolean) {
	return useQuery({
		queryKey: subscriptionKeys.quote(),
		queryFn: () => manageApi.get<SubscriptionQuote>('/subscription/quote'),
		enabled,
	});
}

/** `GET /manage/subscription/plans` row — the active catalogue, for the renew/upgrade picker. */
export interface SubscriptionPlan {
	id: number;
	name: string;
	/** Capability matrix (`{ referral_program: true }`) driving feature gating. */
	features: Record<string, unknown>;
	priceMonthly: number;
	priceAnnual: number;
	/** `null` means unlimited. */
	maxStudents: number | null;
	/** `null` means unlimited. */
	maxBranches: number | null;
	isActive: boolean;
}

export function useSubscriptionPlans(enabled: boolean) {
	return useQuery({
		queryKey: subscriptionKeys.plans(),
		queryFn: () => manageApi.get<SubscriptionPlan[]>('/subscription/plans'),
		enabled,
	});
}

export type SubscriptionInvoiceStatus = 'PAID' | 'UNPAID' | 'FAILED' | 'REFUNDED';

/** `GET /manage/subscription/invoices` row — the period history: one row per purchased billing period. */
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

export function useSubscriptionInvoices(
	params: { page: number; limit: number },
	enabled = true,
) {
	return useQuery({
		queryKey: subscriptionKeys.invoices(params),
		queryFn: () =>
			manageApi.getPaginated<SubscriptionInvoice>('/subscription/invoices', {
				params,
			}) as Promise<PaginatedResult<SubscriptionInvoice>>,
		placeholderData: keepPreviousData,
		enabled,
	});
}

export type SubscriptionPaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
export type SubscriptionPaymentMethod =
	'CLICK' | 'PAYME' | 'UZUM' | 'BANK_TRANSFER' | 'CASH';

/** `GET /manage/subscription/payments` row — the money history: many over the center's lifetime. */
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

export function useSubscriptionPayments(
	params: { page: number; limit: number },
	enabled = true,
) {
	return useQuery({
		queryKey: subscriptionKeys.payments(params),
		queryFn: () =>
			manageApi.getPaginated<SubscriptionPayment>('/subscription/payments', {
				params,
			}) as Promise<PaginatedResult<SubscriptionPayment>>,
		placeholderData: keepPreviousData,
		enabled,
	});
}
