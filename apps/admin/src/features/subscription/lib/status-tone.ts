import type { StatusTone } from '@repo/ui';
import type { SubscriptionAccessState } from '@repo/api-client';

/**
 * Presentational only — tone per subscription state. Kept local to this
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
