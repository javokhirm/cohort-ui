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
	/** Day the daily billing cycle starts generating a period's invoices (1–28). */
	billingDay: number;
	/** Default due-day for periodic invoices (a fee plan may override). */
	dueDay: number;
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
