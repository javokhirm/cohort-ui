import { z } from 'zod';

/**
 * The pay-window sheet on the staff detail Payroll tab, in both modes —
 * creating a window (`POST /staff/:id/payroll-configs`) and correcting one
 * (`PATCH /payroll-configs/:id`). Mirrors the backend rules: a FIXED window
 * needs a salary, a PERCENT window needs a share in (0, 100], and the window
 * starts on `effectiveFrom`. `payrollType` is captured in edit mode too — it
 * drives the pairing rules below — but is never sent on a PATCH, since the
 * backend keeps a window's type immutable.
 */
export const payrollConfigFormSchema = z
	.object({
		payrollType: z.enum(['FIXED', 'PERCENT'], { error: 'Pick a pay model' }),
		baseSalary: z.number().positive('Salary must be greater than 0').optional(),
		payrollPercent: z
			.number()
			.gt(0, 'Percent must be greater than 0')
			.max(100, 'Percent cannot exceed 100')
			.optional(),
		effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a start date'),
	})
	.superRefine((data, ctx) => {
		if (data.payrollType === 'FIXED' && data.baseSalary == null) {
			ctx.addIssue({
				code: 'custom',
				path: ['baseSalary'],
				message: 'Salary is required for fixed pay',
			});
		}
		if (data.payrollType === 'PERCENT' && data.payrollPercent == null) {
			ctx.addIssue({
				code: 'custom',
				path: ['payrollPercent'],
				message: 'Percent is required for percentage pay',
			});
		}
	});

export type PayrollConfigFormValues = z.infer<typeof payrollConfigFormSchema>;
