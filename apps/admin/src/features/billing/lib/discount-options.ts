import { formatPercent, formatPrice } from '@repo/utils';

import type { DiscountType } from '../api/discounts.queries';

/**
 * Human label for a discount's value: "10%" for a percentage, "150 000 UZS" for
 * a fixed amount. Used wherever a discount is picked or summarised (e.g. the
 * standing enrollment-discount sheet). Purely numeric/currency formatting, so no
 * translator is needed — the wording lives in the labels around it.
 */
export function formatDiscountValue(type: DiscountType, value: number): string {
	return type === 'PERCENTAGE' ? formatPercent(value, 0) : `${formatPrice(value)} UZS`;
}

/**
 * Option tables — **values and keys only, never display text** (conventions.md
 * §7). Types resolve against `billing.discountType.*`; active/inactive against
 * the shared `common:state.*`.
 */

/** Type dropdown options for the discount form. */
export const DISCOUNT_TYPE_OPTIONS: { value: DiscountType }[] = [
	{ value: 'PERCENTAGE' },
	{ value: 'FIXED_AMOUNT' },
];

/** Status dropdown options for the edit form (`isActive` retire/restore). */
export const DISCOUNT_STATUS_OPTIONS: {
	value: 'active' | 'inactive';
	labelKey: 'active' | 'inactive';
}[] = [
	{ value: 'active', labelKey: 'active' },
	{ value: 'inactive', labelKey: 'inactive' },
];

/** Active-state filter chips for the list toolbar (maps to `?isActive=`). */
export const DISCOUNT_STATUS_FILTERS: {
	value: 'active' | 'inactive' | undefined;
	labelKey: 'all' | 'active' | 'inactive';
}[] = [
	{ value: undefined, labelKey: 'all' },
	{ value: 'active', labelKey: 'active' },
	{ value: 'inactive', labelKey: 'inactive' },
];
