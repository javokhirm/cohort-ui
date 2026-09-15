import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
	subscriptionKeys,
	type BillingInterval,
	type SubscriptionAccessView,
} from '@repo/api-client';

import { manageApi } from '@/api/apiClient';
import { useSessionStore } from '@/store/sessionStore';

const POLL_INTERVAL_MS = 4000;

/**
 * Whether the server's own `currentPeriodEnd` has reached the period a pending
 * renewal bought. Settlement writes `subscription.currentPeriodEnd =
 * invoice.periodEnd`, so this is exactly "the payment landed" — and both sides
 * are server timestamps, never the client clock (which must never be used to
 * second-guess expiry).
 */
function hasReachedPeriod(
	view: SubscriptionAccessView | undefined,
	periodEnd: string,
): boolean {
	if (!view?.currentPeriodEnd) return false;
	return Date.parse(view.currentPeriodEnd) >= Date.parse(periodEnd);
}

/**
 * The live access state — the same value `SubscriptionGuard` enforces. Also
 * the single writer that keeps the session store's `subscription` fresh past
 * boot, so a settled payment's restored access clears the global block without
 * a page reload.
 *
 * Pass `awaitingPeriodEnd` — the `periodEnd` of the invoice a just-started
 * renewal issued — while waiting for Payme to settle it. The stop condition
 * lives in `refetchInterval`'s function form, reading the query's own
 * last-known data, and `onSettled` fires exactly once (ref-guarded) when a
 * fresh read confirms the period moved — the caller's cue to drop its pending
 * payment state. `hasAccess` cannot be that signal: renewing before the period
 * lapses starts with access already granted, so it would read as settled the
 * instant the poll began.
 */
export function useSubscription(options?: {
	awaitingPeriodEnd?: string | null;
	onSettled?: () => void;
}) {
	const setSubscription = useSessionStore((s) => s.setSubscription);
	const awaitingPeriodEnd = options?.awaitingPeriodEnd ?? null;
	const onSettled = options?.onSettled;
	const query = useQuery({
		queryKey: subscriptionKeys.current(),
		queryFn: () => manageApi.get<SubscriptionAccessView>('/subscription'),
		refetchInterval: (q) => {
			if (!awaitingPeriodEnd) return false;
			return hasReachedPeriod(q.state.data, awaitingPeriodEnd)
				? false
				: POLL_INTERVAL_MS;
		},
	});

	useEffect(() => {
		if (query.data) setSubscription(query.data);
	}, [query.data, setSubscription]);

	const settled =
		awaitingPeriodEnd != null && hasReachedPeriod(query.data, awaitingPeriodEnd);
	const settledRef = useRef(false);
	useEffect(() => {
		if (!awaitingPeriodEnd) {
			settledRef.current = false;
			return;
		}
		if (settled && !settledRef.current) {
			settledRef.current = true;
			onSettled?.();
		}
	}, [awaitingPeriodEnd, settled, onSettled]);

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
