import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { billingPolicyKeys, feePlansKeys } from './keys';
import type {
	BillingMode,
	BillingPolicyResponse,
	ConsumptionRule,
	LateFeeRecurrence,
	LateFeeType,
	PolicyProrationMethod,
} from './billing-policy.queries';

// ─── Input types ─────────────────────────────────────────────────────────────
// Mirror the backend `UpdateBillingPolicyDto`. `PUT /manage/billing-policy` is a
// merge-upsert: only send the fields being changed, the rest are left as-is.

export interface UpdateBillingPolicyInput {
	billingMode?: BillingMode;
	billingDay?: number;
	dueDay?: number;
	immediateDueDays?: number;
	graceDays?: number;
	prorationMethod?: PolicyProrationMethod;
	consumptionRule?: ConsumptionRule;
	chargeOnEnrollment?: boolean;
	autoApplyCredit?: boolean;
	remindersEnabled?: boolean;
	lateFeeEnabled?: boolean;
	lateFeeType?: LateFeeType;
	lateFeeAmount?: number;
	lateFeeRecurrence?: LateFeeRecurrence;
	lateFeeMaxTotal?: number | null;
	autoSuspendAfterDays?: number | null;
	autoCancelAfterDays?: number | null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Update the tenant billing policy (`PUT /manage/billing-policy`, merge-upsert).
 * Fee plans inherit due-day / proration from the policy, so their list is
 * invalidated too. Server rejects invalid combinations with
 * `422 BILLING_POLICY_INVALID_LATE_FEE` / `422 BILLING_POLICY_INVALID_DUNNING_DAYS`.
 */
export function useUpdateBillingPolicy() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateBillingPolicyInput) =>
			manageApi.put<BillingPolicyResponse>('/billing-policy', input),
		onSuccess: (policy) => {
			qc.setQueryData(billingPolicyKeys.detail(), policy);
			void qc.invalidateQueries({ queryKey: billingPolicyKeys.all });
			void qc.invalidateQueries({ queryKey: feePlansKeys.all });
		},
	});
}
