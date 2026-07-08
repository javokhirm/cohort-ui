import { z } from 'zod';

import { DISCOUNT_TYPES } from '../api/discounts.queries';

const optionalDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date')
	.optional()
	.or(z.literal(''));

const optionalCode = z.string().optional().or(z.literal(''));

const baseDiscountSchema = z.object({
	name: z.string().min(1, 'Discount name is required'),
	type: z.enum(DISCOUNT_TYPES),
	value: z
		.number({ error: 'Value is required' })
		.positive('Value must be greater than 0'),
	code: optionalCode,
	validFrom: optionalDate,
	validUntil: optionalDate,
});

function refineDiscount(val: z.infer<typeof baseDiscountSchema>, ctx: z.RefinementCtx) {
	if (val.type === 'PERCENTAGE' && val.value > 100) {
		ctx.addIssue({
			code: 'custom',
			path: ['value'],
			message: 'Percentage cannot exceed 100',
		});
	}
	if (val.validFrom && val.validUntil && val.validUntil < val.validFrom) {
		ctx.addIssue({
			code: 'custom',
			path: ['validUntil'],
			message: 'Valid until must be on or after valid from',
		});
	}
}

export const createDiscountSchema = baseDiscountSchema.superRefine(refineDiscount);

export const editDiscountSchema = baseDiscountSchema
	.extend({
		status: z.enum(['active', 'inactive']),
	})
	.superRefine(refineDiscount);

export type CreateDiscountFormValues = z.infer<typeof createDiscountSchema>;
export type EditDiscountFormValues = z.infer<typeof editDiscountSchema>;

/** Blank string in an optional text/date field → `null` payload. */
export function blankToNull(value: string | undefined): string | null | undefined {
	return value === '' ? null : value;
}
