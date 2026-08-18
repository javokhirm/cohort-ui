import { StatusBadge } from '@repo/ui';
import type { SubscriptionAccessState } from '@repo/api-client';

import { useAppT } from '@/locales';

import { SUBSCRIPTION_STATE_TONE } from '../lib/status-tone';

export function SubscriptionStateBadge({ state }: { state: SubscriptionAccessState }) {
	const t = useAppT('subscription');
	return (
		<StatusBadge tone={SUBSCRIPTION_STATE_TONE[state]}>
			{t(`state.${state}`)}
		</StatusBadge>
	);
}
