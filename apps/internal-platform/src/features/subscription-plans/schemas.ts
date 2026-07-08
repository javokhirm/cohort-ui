import { z } from 'zod/v4';

import type { PlanView } from '@/api/plans/types';

import { ALL_FEATURES } from './constants';

export type DrawerMode = { kind: 'create' } | { kind: 'edit'; plan: PlanView };

export const planSchema = z.object({
	name: z.string().min(1, 'Name is required').max(64),
	priceMonthly: z.number().min(0, 'Price must be 0 or more'),
	priceAnnual: z.number().min(0, 'Price must be 0 or more'),
	maxStudents: z.number().int().min(0),
	maxBranches: z.number().int().min(0),
	storageGb: z.number().int().min(1, 'Storage must be at least 1 GB').optional(),
	billing: z.boolean(),
	payroll: z.boolean(),
	assessments: z.boolean(),
	telegram_bot: z.boolean(),
	api_access: z.boolean(),
	isActive: z.boolean(),
});

export type PlanFormValues = z.infer<typeof planSchema>;

export const EMPTY_FORM: PlanFormValues = {
	name: '',
	priceMonthly: 0,
	priceAnnual: 0,
	maxStudents: 300,
	maxBranches: 1,
	billing: false,
	payroll: false,
	assessments: false,
	telegram_bot: false,
	api_access: false,
	isActive: true,
};

export function planToFormValues(plan: PlanView): PlanFormValues {
	return {
		name: plan.name,
		priceMonthly: plan.priceMonthly,
		priceAnnual: plan.priceAnnual,
		maxStudents: plan.maxStudents ?? 0,
		maxBranches: plan.maxBranches ?? 0,
		billing: Boolean(plan.features['billing']),
		payroll: Boolean(plan.features['payroll']),
		assessments: Boolean(plan.features['assessments']),
		telegram_bot: Boolean(plan.features['telegram_bot']),
		api_access: Boolean(plan.features['api_access']),
		isActive: plan.isActive,
	};
}

export function formValuesToInput(values: PlanFormValues) {
	const features: Record<string, boolean> = {};
	for (const f of ALL_FEATURES) {
		features[f] = values[f];
	}
	return {
		name: values.name,
		priceMonthly: values.priceMonthly,
		priceAnnual: values.priceAnnual,
		maxStudents: values.maxStudents === 0 ? null : values.maxStudents,
		maxBranches: values.maxBranches === 0 ? null : values.maxBranches,
		features,
		isActive: values.isActive,
	};
}
