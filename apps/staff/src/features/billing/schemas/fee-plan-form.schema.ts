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

/** Course is nullable (`null` = applies to any course); sentinel for "any". */
export const ANY_COURSE_VALUE = 'any';

const billingCycle = z.enum(FEE_PLAN_BILLING_CYCLES);

const prorationMethod = z.enum(FEE_PLAN_PRORATION_METHODS);

const dueDay = z
	.number({ error: 'Due day is required' })
	.int('Due day must be a whole number')
	.min(1, 'Due day must be between 1 and 28')
	.max(28, 'Due day must be between 1 and 28');

const gracePeriodDays = z
	.number({ error: 'Grace period is required' })
	.int('Grace period must be a whole number')
	.min(0, 'Grace period cannot be negative');

const lateFeeAmount = z
	.number({ error: 'Late fee is required' })
	.min(0, 'Late fee cannot be negative');

export const createFeePlanSchema = z.object({
	name: z.string().min(1, 'Plan name is required'),
	branch: z.string(),
	course: z.string(),
	amount: z
		.number({ error: 'Amount is required' })
		.positive('Amount must be greater than 0'),
	billingCycle,
	prorationMethod,
	dueDay,
	gracePeriodDays,
	lateFeeAmount,
});

export const editFeePlanSchema = createFeePlanSchema.extend({
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

/** Form course string → payload `courseId` (`null` when "any"). */
export function courseToPayload(course: string): number | null {
	return course === ANY_COURSE_VALUE ? null : Number(course);
}

/** Payload `courseId` → form course string. */
export function courseToForm(courseId: number | null): string {
	return courseId == null ? ANY_COURSE_VALUE : String(courseId);
}
