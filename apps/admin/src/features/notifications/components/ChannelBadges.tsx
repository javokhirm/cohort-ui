import { Badge } from '@repo/ui';

import { useAppT } from '@/locales';
import type { NotificationChannel } from '../api/notifications.queries';

/**
 * A rule's channel list, as badges.
 *
 * `SMS` is the only channel the dispatch worker currently drains, so the others
 * are rendered muted rather than hidden: a rule that names `TELEGRAM` does enqueue
 * rows, and pretending otherwise would leave staff wondering why their messages
 * sit unsent. The visual difference is the honest signal.
 */
export function ChannelBadges({ channels }: { channels: NotificationChannel[] }) {
	const t = useAppT('notifications');

	return (
		<div className="flex flex-wrap gap-1">
			{channels.map((channel) => (
				<Badge
					key={channel}
					variant={channel === 'SMS' ? 'secondary' : 'outline'}
					className={channel === 'SMS' ? undefined : 'text-muted-foreground'}
				>
					{t(`channel.${channel}`)}
				</Badge>
			))}
		</div>
	);
}
