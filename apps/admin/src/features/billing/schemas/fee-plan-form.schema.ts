import { z } from 'zod';

import {
	FEE_PLAN_BILLING_CYCLES,
	FEE_PLAN_PRORATION_METHODS,
} from '../api/fee-plans.queries';

/**
 * Branch is nullable on fee plans (`null` = applies across all branches), so
 * the form models the branch picker as a string and this sentinel stands in
 * for "shared" — same pattern as the course branch picker.
 */
export const SHARED_BRANCH_VALUE = 'shared';

const billingCycle = z.enum(FEE_PLAN_BILLING_CYCLES);

// Due-day and proration are per-plan overrides of the tenant billing policy.
// The controls are optional so a hidden (toggle-off) field never blocks submit;
// the `superRefine` below enforces them only while the matching override is on.
const dueDay = z
	.number()
	.int('Due day must be a whole number')
	.min(1, 'Due day must be between 1 and 28')
	.max(28, 'Due day must be between 1 and 28')
	.optional();

const prorationMethod = z.enum(FEE_PLAN_PRORATION_METHODS).optional();

// A plan is standalone: it carries no course or group. Courses point at a plan
// (`courses.feePlanId`), so assignment happens on the course form.
const feePlanBase = z.object({
	name: z.string().min(1, 'Plan name is required'),
	branch: z.string(),
	amount: z
		.number({ error: 'Amount is required' })
		.positive('Amount must be greater than 0'),
	billingCycle,
	overrideDueDay: z.boolean(),
	dueDay,
	overrideProration: z.boolean(),
	prorationMethod,
});

/** Enforce each override's control only while that override is toggled on. */
function refineOverrides(
	v: {
		overrideDueDay: boolean;
		dueDay?: number;
		overrideProration: boolean;
		prorationMethod?: unknown;
	},
	ctx: z.RefinementCtx,
) {
	if (v.overrideDueDay && v.dueDay == null) {
		ctx.addIssue({
			code: 'custom',
			path: ['dueDay'],
			message: 'Due day is required',
		});
	}
	if (v.overrideProration && v.prorationMethod == null) {
		ctx.addIssue({
			code: 'custom',
			path: ['prorationMethod'],
			message: 'Select a proration method',
		});
	}
}

export const createFeePlanSchema = feePlanBase.superRefine(refineOverrides);

export const editFeePlanSchema = feePlanBase
	.extend({ status: z.enum(['active', 'inactive']) })
	.superRefine(refineOverrides);

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
