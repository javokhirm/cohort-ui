import type { FeePlanBillingCycle } from '../api/fee-plans.queries';

/** Billing cycle dropdown options for the fee plan form. */
export const FEE_PLAN_BILLING_CYCLE_OPTIONS: {
	value: FeePlanBillingCycle;
	label: string;
}[] = [
	{ value: 'MONTHLY', label: 'Monthly' },
	{ value: 'QUARTERLY', label: 'Quarterly' },
	{ value: 'ONE_TIME', label: 'One-time' },
	{ value: 'PER_SESSION', label: 'Per session' },
];

/** Status dropdown options for the edit form (`isActive` retire/restore). */
export const FEE_PLAN_STATUS_OPTIONS = [
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
];

/** Active-state filter chips for the list toolbar (maps to `?isActive=`). */
export const FEE_PLAN_STATUS_FILTERS: {
	value: 'active' | 'inactive' | undefined;
	label: string;
}[] = [
	{ value: undefined, label: 'All' },
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
];
