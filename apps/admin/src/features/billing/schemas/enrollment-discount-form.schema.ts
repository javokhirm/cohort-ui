import { z } from 'zod';

/**
 * Form for assigning a standing discount to an enrollment (§3.13a). `discountId`
 * is held as a string (radio value) and coerced on submit; `validUntil` is an
 * optional `YYYY-MM-DD` "assigned till" date.
 */
export const assignEnrollmentDiscountSchema = z.object({
	discountId: z.string().min(1, 'Select a discount'),
	validUntil: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date')
		.optional()
		.or(z.literal('')),
});

export type AssignEnrollmentDiscountFormValues = z.infer<
	typeof assignEnrollmentDiscountSchema
>;
