import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import type { useAppT } from '@/locales';

type HrT = ReturnType<typeof useAppT<'hr'>>;

/**
 * The pay-window sheet on the staff detail Payroll tab, in both modes —
 * creating a window (`POST /staff/:id/payroll-configs`) and correcting one
 * (`PATCH /payroll-configs/:id`). Mirrors the backend rules: a FIXED window
 * needs a salary, a PERCENT window needs a share in (0, 100], and the window
 * starts on `effectiveFrom`. `payrollType` is captured in edit mode too — it
 * drives the pairing rules below — but is never sent on a PATCH, since the
 * backend keeps a window's type immutable.
 *
 * A factory, not a constant: the messages are user-facing and must re-resolve
 * when the language changes (conventions.md §7).
 */
export function payrollConfigFormSchema(t: Translator<'validation'>, th: HrT) {
	return z
		.object({
			payrollType: z.enum(['FIXED', 'PERCENT'], {
				error: th('payroll.validation.modelRequired'),
			}),
			baseSalary: z.number().positive(t('amountPositive')).optional(),
			payrollPercent: z
				.number()
				.gt(0, t('percentRange'))
				.max(100, t('percentRange'))
				.optional(),
			effectiveFrom: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/, th('payroll.validation.startDateRequired')),
		})
		.superRefine((data, ctx) => {
			if (data.payrollType === 'FIXED' && data.baseSalary == null) {
				ctx.addIssue({
					code: 'custom',
					path: ['baseSalary'],
					message: th('payroll.validation.salaryRequired'),
				});
			}
			if (data.payrollType === 'PERCENT' && data.payrollPercent == null) {
				ctx.addIssue({
					code: 'custom',
					path: ['payrollPercent'],
					message: th('payroll.validation.percentRequired'),
				});
			}
		});
}

export type PayrollConfigFormValues = z.infer<ReturnType<typeof payrollConfigFormSchema>>;
