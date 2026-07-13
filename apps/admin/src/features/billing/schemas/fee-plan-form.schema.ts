import { z } from 'zod';

import { FEE_PLAN_BILLING_CYCLES } from '../api/fee-plans.queries';

/**
 * Branch is nullable on fee plans (`null` = applies across all branches), so
 * the form models the branch picker as a string and this sentinel stands in
 * for "shared" — same pattern as the course branch picker.
 */
export const SHARED_BRANCH_VALUE = 'shared';

const billingCycle = z.enum(FEE_PLAN_BILLING_CYCLES);

/**
 * A plan is standalone: it carries no course or group. Courses point at a plan
 * (`courses.feePlanId`), so assignment happens on the course form.
 *
 * It carries no billing terms either. Due day and proration come from the tenant
 * billing policy and cannot be overridden per plan — a plan says only WHAT to
 * charge, never when or how.
 */
const feePlanBase = z.object({
	name: z.string().min(1, 'Plan name is required'),
	branch: z.string(),
	amount: z
		.number({ error: 'Amount is required' })
		.positive('Amount must be greater than 0'),
	billingCycle,
});

export const createFeePlanSchema = feePlanBase;

export const editFeePlanSchema = feePlanBase.extend({
	status: z.enum(['active', 'inactive']),
});

export type CreateFeePlanFormValues = z.infer<typeof createFeePlanSchema>;
export type EditFeePlanFormValues = z.infer<typeof editFeePlanSchema>;

/** Form branch string → payload `branchId` (`null` when shared). */
export function branchToPayload(branch: string): number | null {
	return branch === SHARED_BRANCH_VALUE ? null : Number(branch);
}

/** Payload `branchId` → form branch string. */
export function branchToForm(branchId: number | null): string {
	return branchId == null ? SHARED_BRANCH_VALUE : String(branchId);
}
