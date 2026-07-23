import type { SubscriptionStatus } from '@/api/subscriptions/types';
import type { useAppT } from '@/locales';

export const PAGE_SIZE = 10;

/** Status filter tabs — labels resolve from the translator at render. */
export function buildStatusTabs(
	t: ReturnType<typeof useAppT<'subscriptions'>>,
): { value: SubscriptionStatus | 'all'; label: string }[] {
	return [
		{ value: 'all', label: t('filter.all') },
		{ value: 'ACTIVE', label: t('statusLabel.active') },
		{ value: 'TRIALING', label: t('statusLabel.trialing') },
		{ value: 'PAST_DUE', label: t('statusLabel.pastDue') },
		{ value: 'CANCELLED', label: t('statusLabel.cancelled') },
	];
}

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
