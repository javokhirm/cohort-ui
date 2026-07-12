import { useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { billingPolicyKeys } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend `BillingPolicyResponseDto` for `/manage/billing-policy`.
// One policy per tenant; `GET` returns the effective values (stored row or the
// platform defaults). The generated `@repo/api-client` OpenAPI types only expose
// request DTOs, so the response shape is hand-declared here — reconcile if the
// spec starts emitting response schemas.

/**
 * `PREPAID` bills the current month in advance. `POSTPAID` bills the previous,
 * fully-elapsed month in arrears via two independent legs — a time-based leg
 * for `MONTHLY` fee plans and a consumption-based leg for `PER_SESSION` plans.
 */
export const BILLING_MODES = ['PREPAID', 'POSTPAID'] as const;
export type BillingMode = (typeof BILLING_MODES)[number];

/**
 * What a billing period is anchored to. `CALENDAR` bills everyone for the same
 * calendar month and prorates a mid-month joiner's first invoice. `ENROLLMENT`
 * rolls each student on their own join-date anniversary (join Jul 12 → billed
 * Jul 12–Aug 11, then Aug 12–Sep 11), so every cycle is whole and charged in
 * full. `ENROLLMENT` is PREPAID-only, and uses `dueOffsetDays` in place of
 * `billingDay`/`dueDay`.
 */
export const BILLING_CYCLE_ANCHORS = ['CALENDAR', 'ENROLLMENT'] as const;
export type BillingCycleAnchor = (typeof BILLING_CYCLE_ANCHORS)[number];

export const POLICY_PRORATION_METHODS = ['SESSION', 'DAILY', 'NONE'] as const;
export type PolicyProrationMethod = (typeof POLICY_PRORATION_METHODS)[number];

/** Which sessions count as chargeable for a `PER_SESSION` fee plan's period. */
export const CONSUMPTION_RULES = [
	'ATTENDED_PLUS_UNEXCUSED',
	'ALL_SCHEDULED',
	'ATTENDED_ONLY',
] as const;
export type ConsumptionRule = (typeof CONSUMPTION_RULES)[number];

export const LATE_FEE_TYPES = ['FIXED', 'PERCENT'] as const;
export type LateFeeType = (typeof LATE_FEE_TYPES)[number];

export const LATE_FEE_RECURRENCES = ['ONE_TIME', 'DAILY', 'WEEKLY'] as const;
export type LateFeeRecurrence = (typeof LATE_FEE_RECURRENCES)[number];

export interface BillingPolicyResponse {
	billingMode: BillingMode;
	/** Calendar month for everyone, or each student's own join-date cycle. */
	billingCycleAnchor: BillingCycleAnchor;
	/** `CALENDAR` only: day the daily cycle generates a period's invoices (1–28). */
	billingDay: number;
	/** `CALENDAR` only: default due-day for periodic invoices (a fee plan may override). */
	dueDay: number;
	/** `ENROLLMENT` only: days after a cycle starts that its invoice is due (0–28). */
	dueOffsetDays: number;
	/** Due offset for charge-on-enrollment invoices; 0 = due same day (0–28). */
	immediateDueDays: number;
	/** Days past due before an invoice flips OVERDUE (0–60). */
	graceDays: number;
	/** Tenant default proration (a fee plan may override). */
	prorationMethod: PolicyProrationMethod;
	consumptionRule: ConsumptionRule;
	/** Issue a prorated invoice immediately on enrollment (PREPAID + MONTHLY plan). */
	chargeOnEnrollment: boolean;
	autoApplyCredit: boolean;
	remindersEnabled: boolean;
	lateFeeEnabled: boolean;
	lateFeeType: LateFeeType;
	/** Fixed amount, or a percentage (≤ 100 when `lateFeeType` is `PERCENT`). */
	lateFeeAmount: number;
	lateFeeRecurrence: LateFeeRecurrence;
	/** `null` = uncapped. */
	lateFeeMaxTotal: number | null;
	/** `null` = disabled. */
	autoSuspendAfterDays: number | null;
	/** `null` = disabled; must exceed `autoSuspendAfterDays` when both are set. */
	autoCancelAfterDays: number | null;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * The tenant billing policy (`GET /manage/billing-policy`). Owner-only on the
 * backend — non-owners get a 403, surfaced to the caller as a query error.
 */
export function useBillingPolicy() {
	return useQuery({
		queryKey: billingPolicyKeys.detail(),
		queryFn: () => manageApi.get<BillingPolicyResponse>('/billing-policy'),
	});
}
