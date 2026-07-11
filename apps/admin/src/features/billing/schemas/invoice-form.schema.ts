import { z } from 'zod';

import { CLIENT_SETTABLE_INVOICE_LINE_ITEM_TYPES } from '../api/invoices.queries';

/** Sentinel for the discount picker's "No discount" choice. */
export const NO_DISCOUNT_VALUE = 'none';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date');

const lineItemSchema = z.object({
	description: z.string().min(1, 'Description is required'),
	quantity: z
		.number({ error: 'Quantity is required' })
		.positive('Quantity must be greater than 0'),
	unitAmount: z
		.number({ error: 'Unit price is required' })
		.positive('Unit price must be greater than 0'),
	type: z.enum(CLIENT_SETTABLE_INVOICE_LINE_ITEM_TYPES),
});

export const createInvoiceSchema = z.object({
	studentId: z.number({ error: 'Student is required' }).positive('Student is required'),
	branchId: z.number({ error: 'Branch is required' }).positive('Branch is required'),
	dueDate: dateString,
	lineItems: z.array(lineItemSchema).min(1, 'Add at least one line item'),
	discountId: z.string(),
	notes: z.string().optional().or(z.literal('')),
});

export const editInvoiceSchema = z.object({
	dueDate: dateString,
	notes: z.string().optional().or(z.literal('')),
});

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;
export type EditInvoiceFormValues = z.infer<typeof editInvoiceSchema>;
export type LineItemFormValues = CreateInvoiceFormValues['lineItems'][number];
