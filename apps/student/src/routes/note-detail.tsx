import { useEffect } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { AlertTriangle, ArrowLeft, ChevronRight } from 'lucide-react';

import { Button, cn, EmptyState, Skeleton, StatusBadge } from '@repo/ui';
import { formatDateTime } from '@repo/utils';

import { useMarkRead } from '@/features/inbox/api/notifications.mutations';
import { useNotification } from '@/features/inbox/api/notifications.queries';
import { CATEGORY_META, CATEGORY_TINT_CLASS } from '@/features/inbox/lib/category-meta';
import { useAppT } from '@/locales';

/** The backend's `link` section tokens and their localized CTA keys. */
const LINK_LABELS = {
	invoices: 'actionInvoices',
	results: 'actionResults',
	schedule: 'actionSchedule',
	attendance: 'actionAttendance',
} as const;

type LinkToken = keyof typeof LINK_LABELS;

/**
 * Notification detail (`GET /student/notifications/:id`), per the design: back link,
 * category icon + badge, title, full timestamp and body, and — when the notification
 * links a section — a primary action that navigates there. Opening an unread one marks
 * it read (`PATCH :id/read`), which also clears the bell dot.
 */
export function NoteDetailRoute() {
	const t = useAppT('inbox');
	const navigate = useNavigate();
	const { noteId } = useParams({ from: '/_authed/inbox/$noteId' });
	const { data, isPending, isError } = useNotification(Number(noteId));
	const markRead = useMarkRead();

	// Opening the note is what reads it. Guarded by `isPending` (mutation in flight) and
	// re-checked via `isRead` so a refetch after invalidation doesn't loop.
	const { mutate: markReadMutate, isPending: marking } = markRead;
	useEffect(() => {
		if (data && !data.isRead && !marking) {
			markReadMutate(data.id);
		}
	}, [data, marking, markReadMutate]);

	const linkToken =
		data?.link && data.link in LINK_LABELS ? (data.link as LinkToken) : undefined;

	function openLink(token: LinkToken) {
		switch (token) {
			case 'invoices':
				void navigate({ to: '/billing' });
				break;
			case 'results':
				void navigate({ to: '/progress', search: { tab: 'grades' } });
				break;
			case 'schedule':
				void navigate({ to: '/schedule' });
				break;
			case 'attendance':
				void navigate({ to: '/progress', search: { tab: 'attendance' } });
				break;
		}
	}

	return (
		<div className="mx-auto w-full max-w-160 pb-8">
			<Link
				to="/inbox"
				className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				{t('backToInbox')}
			</Link>

			{isPending ? (
				<Skeleton className="h-48 w-full rounded-2xl" />
			) : isError || !data ? (
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<AlertTriangle />}
						title={t('errorTitle')}
						description={t('errorDescription')}
					/>
				</div>
			) : (
				<>
					<div className="flex items-center gap-3">
						<span
							className={cn(
								'flex size-12 shrink-0 items-center justify-center rounded-[13px] [&>svg]:size-5.5',
								CATEGORY_TINT_CLASS[data.category],
							)}
						>
							{(() => {
								const { Icon } = CATEGORY_META[data.category];
								return <Icon />;
							})()}
						</span>
						<div className="min-w-0">
							<StatusBadge tone={CATEGORY_META[data.category].tone}>
								{t(`category.${data.category}`)}
							</StatusBadge>
							<h1 className="mt-1 text-lg font-bold text-foreground">
								{data.title}
							</h1>
						</div>
					</div>

					<p className="mb-1 mt-3.5 text-[11.5px] text-muted-foreground">
						{formatDateTime(data.sentAt ?? data.createdAt)}
					</p>
					{data.body && (
						<p className="text-sm leading-relaxed text-foreground/80">
							{data.body}
						</p>
					)}

					{linkToken && (
						<Button
							className="mt-5 gap-1.5"
							onClick={() => openLink(linkToken)}
						>
							{t(LINK_LABELS[linkToken])}
							<ChevronRight className="size-4" />
						</Button>
					)}
				</>
			)}
		</div>
	);
}
