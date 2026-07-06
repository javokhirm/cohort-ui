import type {
	FeePlanBillingCycle,
	FeePlanProrationMethod,
} from '../api/fee-plans.queries';

/** Billing cycle dropdown options for the fee plan form. */
export const FEE_PLAN_BILLING_CYCLE_OPTIONS: {
	value: FeePlanBillingCycle;
	label: string;
}[] = [
	{ value: 'MONTHLY', label: 'Monthly' },
	{ value: 'ONE_TIME', label: 'One-time' },
	{ value: 'PER_SESSION', label: 'Per session' },
];

/** Amount field label per billing cycle — `PER_SESSION` charges a per-session price, not a monthly amount. */
export const FEE_PLAN_AMOUNT_LABELS: Record<FeePlanBillingCycle, string> = {
	MONTHLY: 'Amount (UZS) *',
	ONE_TIME: 'Amount (UZS) *',
	PER_SESSION: 'Price per session (UZS) *',
};

/** Proration control options for the fee plan form (segmented, mid-month joins). */
export const FEE_PLAN_PRORATION_OPTIONS: {
	value: FeePlanProrationMethod;
	label: string;
}[] = [
	{ value: 'SESSION', label: 'Session-based' },
	{ value: 'DAILY', label: 'Daily' },
	{ value: 'NONE', label: 'None' },
];

/** Short label per proration method for read-only display (list column). */
export const FEE_PLAN_PRORATION_LABELS: Record<FeePlanProrationMethod, string> = {
	SESSION: 'Session-based',
	DAILY: 'Daily',
	NONE: 'None',
};

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
