import type { StatusTone } from '@repo/ui';
import type { SubscriptionAccessState } from '@repo/api-client';

import type {
	SubscriptionInvoiceStatus,
	SubscriptionPaymentStatus,
} from '../api/subscription.queries';

/**
 * Presentational only — tone per subscription status. Kept local to this
 * feature (not `@repo/ui`'s shared `STATUS_MAPS`) because this state isn't a
 * cross-app domain status; labels come from this app's own `subscription`
 * catalog and reach `StatusBadge` as `children`, same split as everywhere else
 * (conventions.md §7).
 */
export const SUBSCRIPTION_STATE_TONE: Record<SubscriptionAccessState, StatusTone> = {
	TRIALING: 'blue',
	ACTIVE: 'green',
	PAST_DUE: 'amber',
	EXPIRED: 'red',
	CANCELLED: 'slate',
	SUSPENDED: 'red',
	NONE: 'slate',
};

export const SUBSCRIPTION_INVOICE_STATUS_TONE: Record<
	SubscriptionInvoiceStatus,
	StatusTone
> = {
	PAID: 'green',
	UNPAID: 'slate',
	FAILED: 'red',
	REFUNDED: 'violet',
};

export const SUBSCRIPTION_PAYMENT_STATUS_TONE: Record<
	SubscriptionPaymentStatus,
	StatusTone
> = {
	PENDING: 'amber',
	SUCCEEDED: 'green',
	FAILED: 'red',
	REFUNDED: 'violet',
};
