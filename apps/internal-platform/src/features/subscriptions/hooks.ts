import { useQuery } from '@tanstack/react-query';

import { subscriptionsKeys } from '@/api/subscriptions/keys';
import {
	getSubscriptionAnalytics,
	listSubscriptions,
} from '@/api/subscriptions/subscriptions.queries';
import type { SubscriptionStatus } from '@/api/subscriptions/types';

import { PAGE_SIZE } from './constants';

export function useSubscriptionAnalytics() {
	return useQuery({
		queryKey: subscriptionsKeys.analytics(),
		queryFn: getSubscriptionAnalytics,
	});
}

export function useSubscriptionList({
	page,
	status,
}: {
	page: number;
	status?: SubscriptionStatus;
}) {
	return useQuery({
		queryKey: subscriptionsKeys.list({ page, limit: PAGE_SIZE, status }),
		queryFn: () => listSubscriptions({ page, limit: PAGE_SIZE, status }),
	});
}
