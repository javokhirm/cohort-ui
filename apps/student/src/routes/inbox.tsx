import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Bell, CheckCheck } from 'lucide-react';

import { Button, EmptyState, Skeleton } from '@repo/ui';

import { useMarkAllRead } from '@/features/inbox/api/notifications.mutations';
import { useNotifications, useUnreadCount } from '@/features/inbox/api/notifications.queries';
import { NotificationRow } from '@/features/inbox/components/NotificationRow';
import { useAppT } from '@/locales';

/**
 * The student's inbox (api-reference §5.10), reached from the app bar's bell: the unread
 * summary with "Mark all read", then the notification rows newest first. Tapping a row
 * opens its detail (which marks it read).
 */
export function InboxRoute() {
	const t = useAppT('inbox');
	const navigate = useNavigate();
	const notifications = useNotifications();
	const unread = useUnreadCount();
	const markAllRead = useMarkAllRead();

	const rows = notifications.data?.pages.flatMap((p) => p.rows) ?? [];
	const unreadCount = unread.data ?? 0;

	if (notifications.isPending) {
		return (
			<div className="mx-auto flex w-full max-w-180 flex-col gap-2.5 pb-8">
				<Skeleton className="h-20 w-full rounded-[14px]" />
				<Skeleton className="h-20 w-full rounded-[14px]" />
				<Skeleton className="h-20 w-full rounded-[14px]" />
			</div>
		);
	}

	if (notifications.isError) {
		return (
			<div className="mx-auto w-full max-w-180 rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<AlertTriangle />}
					title={t('errorTitle')}
					description={t('errorDescription')}
					action={
						<Button
							variant="outline"
							onClick={() => void notifications.refetch()}
						>
							{t('retry')}
						</Button>
					}
				/>
			</div>
		);
	}

	if (rows.length === 0) {
		return (
			<div className="mx-auto w-full max-w-180 pb-8">
				<EmptyState
					icon={<Bell />}
					title={t('emptyTitle')}
					description={t('emptyDescription')}
				/>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-180 pb-8">
			<div className="mb-3 flex items-center justify-between px-0.5">
				<span className="text-[12.5px] text-muted-foreground">
					{unreadCount > 0
						? t('unreadCount', { count: unreadCount })
						: t('allCaughtUp')}
				</span>
				{unreadCount > 0 && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 gap-1.5 px-2 text-[12.5px] font-semibold text-primary"
						disabled={markAllRead.isPending}
						onClick={() => markAllRead.mutate()}
					>
						<CheckCheck className="size-3.5" />
						{t('markAllRead')}
					</Button>
				)}
			</div>

			<div className="flex flex-col gap-2.5">
				{rows.map((notification) => (
					<NotificationRow
						key={notification.id}
						notification={notification}
						onOpen={() =>
							void navigate({
								to: '/inbox/$noteId',
								params: { noteId: String(notification.id) },
							})
						}
					/>
				))}
			</div>

			{notifications.hasNextPage && (
				<Button
					variant="outline"
					className="mt-3 w-full text-primary"
					disabled={notifications.isFetchingNextPage}
					onClick={() => void notifications.fetchNextPage()}
				>
					{t('loadMore')}
				</Button>
			)}
		</div>
	);
}
