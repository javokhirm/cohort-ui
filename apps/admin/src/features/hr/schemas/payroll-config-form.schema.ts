import { z } from 'zod';

/**
 * "Change pay model" sheet on the staff detail Payroll tab — creates a new
 * payroll-config window (`POST /staff/:id/payroll-configs`). Mirrors the
 * backend rules: a FIXED window needs a salary, a PERCENT window needs a share
 * in (0, 100], and the window starts on `effectiveFrom`.
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
