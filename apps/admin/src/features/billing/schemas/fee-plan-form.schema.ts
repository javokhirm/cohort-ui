import { z } from 'zod';

import { FEE_PLAN_BILLING_CYCLES } from '../api/fee-plans.queries';

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
