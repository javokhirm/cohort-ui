import { Card, CardContent, CardHeader, CardTitle, cn } from '@repo/ui';

import { formatNumber } from '@repo/utils';
import type { SubscriptionStatusCounts } from '@/api/dashboard/types';
import { useAppT } from '@/locales';

import {
	SUBSCRIPTION_STATUS_ORDER,
	SUBSCRIPTION_STATUS_TONE,
	TONE_TEXT_CLASS,
	subscriptionStatusLabel,
} from '../constants';

/**
 * The subscription-state counters. Every state in {@link SUBSCRIPTION_STATUS_ORDER}
 * is always rendered and zero-filled — a state with no subscriptions still shows
 * "0", never nothing, so "none" can't be mistaken for "no data".
 */
export function SubscriptionCounters({ counts }: { counts: SubscriptionStatusCounts }) {
	const t = useAppT('dashboard');

	return (
		<Card className="gap-0 py-0">
			<CardHeader className="border-b border-border px-5 py-4">
				<CardTitle className="text-sm font-semibold">
					{t('card.subscriptionStates')}
				</CardTitle>
				<p className="text-xs text-muted-foreground">
					{t('card.subscriptionStatesHint')}
				</p>
			</CardHeader>
			<CardContent className="grid grid-cols-2 gap-px overflow-hidden rounded-b-xl bg-border sm:grid-cols-3 lg:grid-cols-5">
				{SUBSCRIPTION_STATUS_ORDER.map((status) => (
					<div key={status} className="flex flex-col gap-1 bg-card px-5 py-4">
						<span className="text-xs text-muted-foreground">
							{subscriptionStatusLabel(t, status)}
						</span>
						<span
							className={cn(
								'text-2xl font-bold tabular-nums',
								TONE_TEXT_CLASS[SUBSCRIPTION_STATUS_TONE[status]],
							)}
						>
							{formatNumber(counts[status])}
						</span>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
