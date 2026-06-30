import type { SubscriptionStatus } from '@/api/subscriptions/types';

export const PAGE_SIZE = 10;

export const STATUS_TABS: { value: SubscriptionStatus | 'all'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'TRIALING', label: 'Trialing' },
	{ value: 'PAST_DUE', label: 'Past due' },
	{ value: 'CANCELLED', label: 'Cancelled' },
];

export const AVATAR_PALETTE = [
	'bg-tone-green-bg text-tone-green-fg',
	'bg-tone-indigo-bg text-tone-indigo-fg',
	'bg-tone-violet-bg text-tone-violet-fg',
	'bg-tone-blue-bg text-tone-blue-fg',
	'bg-tone-cyan-bg text-tone-cyan-fg',
	'bg-tone-pink-bg text-tone-pink-fg',
	'bg-tone-amber-bg text-tone-amber-fg',
	'bg-tone-orange-bg text-tone-orange-fg',
	'bg-tone-red-bg text-tone-red-fg',
	'bg-tone-slate-bg text-tone-slate-fg',
];
