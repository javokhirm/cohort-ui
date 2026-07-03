import type { DiscountType } from '../api/discounts.queries';

/** Type dropdown options for the discount form. */
export const DISCOUNT_TYPE_OPTIONS: { value: DiscountType; label: string }[] = [
	{ value: 'PERCENTAGE', label: 'Percentage' },
	{ value: 'FIXED_AMOUNT', label: 'Fixed amount' },
];

/** Status dropdown options for the edit form (`isActive` retire/restore). */
export const DISCOUNT_STATUS_OPTIONS = [
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
];

/** Active-state filter chips for the list toolbar (maps to `?isActive=`). */
export const DISCOUNT_STATUS_FILTERS: {
	value: 'active' | 'inactive' | undefined;
	label: string;
}[] = [
	{ value: undefined, label: 'All' },
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
];
