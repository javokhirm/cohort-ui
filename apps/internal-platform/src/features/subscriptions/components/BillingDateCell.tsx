import { formatDate } from '@repo/utils';
import type { SubscriptionStatus } from '@/api/subscriptions/types';

export function BillingDateCell({
	status,
	currentPeriodEnd,
	cancelledAt,
}: {
	status: SubscriptionStatus;
	currentPeriodEnd: string;
	cancelledAt: string | null;
}) {
	if (status === 'TRIALING') {
		return <span className="text-sm font-medium text-tone-blue-fg">In trial</span>;
	}

	if (status === 'PAST_DUE') {
		return (
			<span className="text-sm font-medium text-tone-red-fg">
				Overdue · {formatDate(currentPeriodEnd)}
			</span>
		);
	}

	if (status === 'CANCELLED') {
		return (
			<span className="text-sm text-muted-foreground">
				{cancelledAt ? formatDate(cancelledAt) : '—'}
			</span>
		);
	}

	return <span className="text-sm">{formatDate(currentPeriodEnd)}</span>;
}
