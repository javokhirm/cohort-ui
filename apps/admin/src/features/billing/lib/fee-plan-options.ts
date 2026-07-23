import type { FeePlanBillingCycle } from '../api/fee-plans.queries';

/**
 * Fee-plan option tables — **values and keys only, never display text**
 * (conventions.md §7). Cycles resolve against `billing.billingCycle.*`;
 * active/inactive against the shared `common:state.*`.
 */

/** Billing cycle dropdown options for the fee plan form. */
export const FEE_PLAN_BILLING_CYCLE_OPTIONS: { value: FeePlanBillingCycle }[] = [
	{ value: 'MONTHLY' },
	{ value: 'PER_SESSION' },
];

/**
 * Amount-field label key per billing cycle — `PER_SESSION` charges a per-session
 * price, not a monthly amount, so the two forms word the field differently.
 */
export const FEE_PLAN_AMOUNT_LABEL_KEYS: Record<
	FeePlanBillingCycle,
	'amountMonthly' | 'amountPerSession'
> = {
	MONTHLY: 'amountMonthly',
	PER_SESSION: 'amountPerSession',
};

/** Status dropdown options for the edit form (`isActive` retire/restore). */
export const FEE_PLAN_STATUS_OPTIONS: {
	value: 'active' | 'inactive';
	labelKey: 'active' | 'inactive';
}[] = [
	{ value: 'active', labelKey: 'active' },
	{ value: 'inactive', labelKey: 'inactive' },
];

/** Active-state filter chips for the list toolbar (maps to `?isActive=`). */
export const FEE_PLAN_STATUS_FILTERS: {
	value: 'active' | 'inactive' | undefined;
	labelKey: 'all' | 'active' | 'inactive';
}[] = [
	{ value: undefined, labelKey: 'all' },
	{ value: 'active', labelKey: 'active' },
	{ value: 'inactive', labelKey: 'inactive' },
];
