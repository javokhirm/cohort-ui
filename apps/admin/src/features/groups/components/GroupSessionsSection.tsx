import { useState } from 'react';
import { BookOpen, CalendarDays, ChevronRight, MapPin, UserCog } from 'lucide-react';

import { Card, EmptyState, SearchFilterBar, Skeleton, StatusBadge } from '@repo/ui';
import { formatShortDate, todayIsoDate } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';

import { useAppT } from '@/locales';

import { useGroupSessions, type SessionCalendarItem } from '../api/groups.queries';
import {
	hhmm,
	partitionSessions,
	SESSION_VIEWS,
	type SessionView,
} from '../lib/group-options';
import { SessionDetailSheet } from './SessionDetailSheet';

interface GroupSessionsSectionProps {
	groupId: number;
}

/**
 * The group's classes, split into what's next, what already ran, and what was
 * called off — and opening on **Upcoming**.
 *
 * It used to render every class in one flat ascending list, so a group that
 * started in March opened on March: the answer an admin came for ("what's next,
 * did anything move?") was at the bottom of a hundred rows, with no filter.
 */
export function GroupSessionsSection({ groupId }: GroupSessionsSectionProps) {
	const t = useAppT('groups');
	const tc = useT('common');
	const { data: sessions = [], isLoading, isError } = useGroupSessions(groupId);
	const [view, setView] = useState<SessionView>('upcoming');
	const [openSessionId, setOpenSessionId] = useState<number | null>(null);

	const partitioned = partitionSessions(sessions, todayIsoDate());
	const visible = partitioned[view];

	return (
		<div className="flex flex-col gap-3">
			<SearchFilterBar
				filters={SESSION_VIEWS.map((v) => ({
					id: v,
					label: t(`sessions.filter.${v}`),
					count: partitioned[v].length,
					active: view === v,
					onClick: () => setView(v),
				}))}
			/>

			{isLoading ? (
				<Card className="gap-0 divide-y divide-border py-0">
					{[1, 2, 3].map((i) => (
						<div key={i} className="px-4 py-3.5">
							<Skeleton className="h-9 w-full" />
						</div>
					))}
				</Card>
			) : isError ? (
				<Card className="py-0">
					<EmptyState
						icon={<CalendarDays />}
						title={tc('table.error')}
						description={tc('table.errorHint')}
					/>
				</Card>
			) : sessions.length === 0 ? (
				<Card className="py-0">
					<EmptyState
						icon={<CalendarDays />}
						title={t('sessions.emptyTitle')}
						description={t('sessions.emptyDescription')}
					/>
				</Card>
			) : visible.length === 0 ? (
				<Card className="px-4 py-6 text-center text-sm text-muted-foreground">
					{t('sessions.emptyFiltered')}
				</Card>
			) : (
				<Card className="gap-0 divide-y divide-border py-0">
					{visible.map((s) => (
						<SessionRow
							key={s.id}
							session={s}
							onClick={() => setOpenSessionId(s.id)}
						/>
					))}
				</Card>
			)}

			<SessionDetailSheet
				sessionId={openSessionId}
				open={openSessionId != null}
				onOpenChange={(o) => !o && setOpenSessionId(null)}
				groupId={groupId}
			/>
		</div>
	);
}

function SessionRow({
	session,
	onClick,
}: {
	session: SessionCalendarItem;
	onClick: () => void;
}) {
	const t = useAppT('groups');
	const statusLabel = useStatusLabel();
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted"
		>
			<div className="flex min-w-0 flex-col gap-0.5">
				<span className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
					<span>{formatShortDate(session.sessionDate)}</span>
					<span className="tabular-nums">
						{hhmm(session.startTime)}–{hhmm(session.endTime)}
					</span>
				</span>
				<span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<MapPin className="size-3" />
						{session.roomName ?? t('noRoom')}
					</span>
					<span className="flex items-center gap-1">
						<UserCog className="size-3" />
						{session.teacherName ?? t('unassigned')}
					</span>
					{session.topic && (
						<span className="flex items-center gap-1">
							<BookOpen className="size-3" />
							<span className="truncate">{session.topic}</span>
						</span>
					)}
				</span>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<StatusBadge kind="session" status={session.status}>
					{statusLabel('session', session.status)}
				</StatusBadge>
				<ChevronRight className="size-4 text-muted-foreground/50" />
			</div>
		</button>
	);
}
