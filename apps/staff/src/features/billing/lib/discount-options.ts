import { formatPercent, formatPrice } from '@repo/utils';

import type { DiscountType } from '../api/discounts.queries';

/**
 * Human label for a discount's value: "10%" for a percentage, "150 000 UZS" for
 * a fixed amount. Used wherever a discount is picked or summarised (e.g. the
 * standing enrollment-discount sheet).
 */
export function formatDiscountValue(type: DiscountType, value: number): string {
	return type === 'PERCENTAGE' ? formatPercent(value, 0) : `${formatPrice(value)} UZS`;
}

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
