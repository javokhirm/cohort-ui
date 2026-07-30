import { cn } from '@repo/ui';
import { formatRelative } from '@repo/utils';

import type { StudentNotification } from '../api/notifications.queries';
import { CATEGORY_META, CATEGORY_TINT_CLASS } from '../lib/category-meta';

interface NotificationRowProps {
	notification: StudentNotification;
	onOpen: () => void;
}

/**
 * One inbox row per the design: a category-tinted icon box, title + relative time, a
 * two-line body preview, and the primary unread dot.
 */
export function NotificationRow({ notification, onOpen }: NotificationRowProps) {
	const { Icon } = CATEGORY_META[notification.category];

	return (
		<button
			type="button"
			onClick={onOpen}
			className="flex w-full cursor-pointer items-start gap-3 rounded-[14px] border border-border bg-card p-3.5 text-left shadow-sm transition-colors hover:border-primary"
		>
			<span
				className={cn(
					'flex size-10 shrink-0 items-center justify-center rounded-[11px] [&>svg]:size-4.5',
					CATEGORY_TINT_CLASS[notification.category],
				)}
			>
				<Icon />
			</span>
			<span className="min-w-0 flex-1">
				<span className="flex items-center gap-2">
					<span className="truncate text-[13.5px] font-bold text-foreground">
						{notification.title}
					</span>
					<span className="shrink-0 text-[10.5px] text-muted-foreground">
						{formatRelative(notification.sentAt ?? notification.createdAt)}
					</span>
				</span>
				{notification.body && (
					<span className="mt-0.5 line-clamp-2 text-[12.5px] leading-normal text-muted-foreground">
						{notification.body}
					</span>
				)}
			</span>
			{!notification.isRead && (
				<span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
			)}
		</button>
	);
}
