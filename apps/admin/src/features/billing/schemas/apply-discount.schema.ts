import { z } from 'zod';

/**
 * Picking a discount to apply to an existing invoice (`POST /invoices/:id/discounts`).
 * The id is carried as a string (the `Select` value) and coerced on submit, matching
 * the create-invoice form's discount field.
 */
export const applyDiscountSchema = z.object({
	discountId: z.string().min(1, 'Select a discount'),
});

export type ApplyDiscountFormValues = z.infer<typeof applyDiscountSchema>;
