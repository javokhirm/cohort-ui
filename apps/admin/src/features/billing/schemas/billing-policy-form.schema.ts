import { z } from 'zod';

import {
	BILLING_MODES,
	CONSUMPTION_RULES,
	LATE_FEE_RECURRENCES,
	LATE_FEE_TYPES,
	POLICY_PRORATION_METHODS,
} from '../api/billing-policy.queries';

const dayOfMonth = z
	.number({ error: 'Required' })
	.int('Must be a whole number')
	.min(1, 'Must be between 1 and 28')
	.max(28, 'Must be between 1 and 28');

const offsetDays = (maxDays: number) =>
	z
		.number({ error: 'Required' })
		.int('Must be a whole number')
		.min(0, 'Cannot be negative')
		.max(maxDays, `Cannot exceed ${maxDays}`);

/** Nullable positive-day field (`null` = disabled). */
const dunningDays = z
	.number({ error: 'Required' })
	.int('Must be a whole number')
	.min(1, 'Must be at least 1')
	.nullable();

/**
 * Mirrors `UpdateBillingPolicyDto` plus the two server cross-field rules:
 * `BILLING_POLICY_INVALID_LATE_FEE` (percent > 100) and
 * `BILLING_POLICY_INVALID_DUNNING_DAYS` (cancel must exceed suspend).
 */
export const billingPolicySchema = z
	.object({
		billingMode: z.enum(BILLING_MODES),
		billingDay: dayOfMonth,
		dueDay: dayOfMonth,
		immediateDueDays: offsetDays(28),
		graceDays: offsetDays(60),
		prorationMethod: z.enum(POLICY_PRORATION_METHODS),
		consumptionRule: z.enum(CONSUMPTION_RULES),
		chargeOnEnrollment: z.boolean(),
		autoApplyCredit: z.boolean(),
		remindersEnabled: z.boolean(),
		lateFeeEnabled: z.boolean(),
		lateFeeType: z.enum(LATE_FEE_TYPES),
		lateFeeAmount: z.number({ error: 'Required' }).min(0, 'Cannot be negative'),
		lateFeeRecurrence: z.enum(LATE_FEE_RECURRENCES),
		lateFeeMaxTotal: z
			.number({ error: 'Required' })
			.min(0, 'Cannot be negative')
			.nullable(),
		autoSuspendAfterDays: dunningDays,
		autoCancelAfterDays: dunningDays,
	})
	.superRefine((v, ctx) => {
		if (v.lateFeeType === 'PERCENT' && v.lateFeeAmount > 100) {
			ctx.addIssue({
				code: 'custom',
				path: ['lateFeeAmount'],
				message: 'A percentage late fee cannot exceed 100%.',
			});
		}
		if (
			v.autoSuspendAfterDays != null &&
			v.autoCancelAfterDays != null &&
			v.autoCancelAfterDays <= v.autoSuspendAfterDays
		) {
			ctx.addIssue({
				code: 'custom',
				path: ['autoCancelAfterDays'],
				message: 'Auto-cancel days must be greater than auto-suspend days.',
			});
		}
	});

export type BillingPolicyFormValues = z.infer<typeof billingPolicySchema>;
