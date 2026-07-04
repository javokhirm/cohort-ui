import { z } from 'zod';

/** Calendar date, no time component (api-reference.md → Conventions: `YYYY-MM-DD`). */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A single ad-hoc payroll record (`POST /manage/payrolls`) — branch is derived
 * from the selected staff member, not entered separately. `grossAmount` is
 * required only when `autoCalculate` is off (enforced server-side too).
 */
export const createPayrollSchema = z
	.object({
		staffId: z.number({ error: 'Staff is required' }).int().positive(),
		periodStart: z.string().regex(ISO_DATE, 'Use a valid date'),
		periodEnd: z.string().regex(ISO_DATE, 'Use a valid date'),
		autoCalculate: z.boolean(),
		grossAmount: z.number().min(0).optional(),
		deductions: z.number().min(0).optional(),
	})
	.refine((data) => data.autoCalculate || data.grossAmount != null, {
		message: 'Gross amount is required when auto-calculate is off',
		path: ['grossAmount'],
	});

export type CreatePayrollFormValues = z.infer<typeof createPayrollSchema>;

/**
 * Edits to a DRAFT payroll (`PATCH /manage/payrolls/:id`) — gross, deductions
 * and the informational breakdown; `netAmount` is recomputed server-side.
 */
export const editPayrollSchema = z.object({
	grossAmount: z.number({ error: 'Gross amount is required' }).min(0),
	deductions: z.number().min(0).optional(),
	hoursTaught: z.number().min(0).optional(),
	rate: z.number().min(0).optional(),
	bonuses: z.number().min(0).optional(),
});

export type EditPayrollFormValues = z.infer<typeof editPayrollSchema>;
