import { cn } from '@repo/ui';
import { formatNumber } from '@repo/utils';

import { useAppT } from '@/locales';

import { useChannelSettings } from '../api/notifications.queries';

/**
 * The header's SMS health pill — a colored dot, the channel's operational state,
 * and today's usage against the daily cap. Read from `GET /notification-settings`,
 * so it is only mounted when the principal holds `notification-settings.manage`
 * (that endpoint 403s otherwise); the caller gates the render.
 *
 * The state worth surfacing is `isEnabled && !isOperational`: the center thinks
 * SMS is on but nothing can send, shown amber rather than green so it reads as a
 * problem, not a healthy status. It falls back to nothing while the settings load
 * or when no SMS row exists (a center that has never configured a provider).
 */
export function SmsStatusPill() {
	const tn = useAppT('notifications');
	const { data } = useChannelSettings(true);

	const sms = data?.find((channel) => channel.channel === 'SMS');
	if (!sms) return null;

	const state = sms.isOperational ? 'operational' : sms.isEnabled ? 'broken' : 'off';

	const label =
		state === 'operational'
			? tn('console.smsOperational')
			: state === 'broken'
				? tn('console.smsBroken')
				: tn('console.smsOff');

	const dotClass =
		state === 'operational'
			? 'bg-tone-green-fg'
			: state === 'broken'
				? 'bg-tone-amber-fg'
				: 'bg-muted-foreground';

	const usage =
		sms.dailyLimit != null
			? tn('console.usage', {
					sent: formatNumber(sms.sentToday),
					limit: formatNumber(sms.dailyLimit),
				})
			: tn('console.usageUncapped', { sent: formatNumber(sms.sentToday) });

	return (
		<div className="flex items-center gap-2.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
			<span className="flex items-center gap-1.5 font-medium text-foreground">
				<span className={cn('size-1.5 rounded-full', dotClass)} />
				{label}
			</span>
			<span className="h-3 w-px bg-border" />
			<span className="text-muted-foreground">{usage}</span>
		</div>
	);
}
