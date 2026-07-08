import type { SubscriptionListFilters } from './types';

export const subscriptionsKeys = {
	all: ['subscriptions'] as const,
	list: (filters?: SubscriptionListFilters) =>
		[...subscriptionsKeys.all, 'list', filters ?? {}] as const,
	analytics: () => [...subscriptionsKeys.all, 'analytics'] as const,
};
