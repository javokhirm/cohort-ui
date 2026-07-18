import type { KeyboardEvent } from 'react';
import { CalendarX, ChevronRight } from 'lucide-react';

import { EmptyState, Separator, Skeleton, StatusBadge } from '@repo/ui';
import { formatTime, formatWeekday } from '@repo/utils';

import { useGroupSessions, type TeachSession } from '../api/sessions.queries';
import { formatDayMonth } from '../lib/session-date';

interface GroupScheduleTabProps {
	groupId: number;
	onOpenSession: (sessionId: number) => void;
}

interface SessionRowProps {
	session: TeachSession;
	onOpen: () => void;
}

function SessionRow({ session, onOpen }: SessionRowProps) {
	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		onOpen();
	};

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onOpen}
			onKeyDown={onKeyDown}
			className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary active:bg-muted/60 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
		>
			<div className="w-12.5 shrink-0 text-center">
				<div className="text-[14px] font-bold text-foreground">
					{formatWeekday(session.sessionDate)}
				</div>
				<div className="text-[11px] whitespace-nowrap text-muted-foreground/70">
					{formatDayMonth(session.sessionDate)}
				</div>
			</div>

			<Separator orientation="vertical" className="h-7.5" />

			<div className="min-w-0 flex-1">
				<div className="text-[13px] font-semibold tabular-nums text-foreground">
					{formatTime(session.startTime)}–{formatTime(session.endTime)}
				</div>
				<div className="truncate text-[11.5px] text-muted-foreground">
					{session.roomName ?? 'No room set'}
				</div>
			</div>

			<StatusBadge kind="session" status={session.status} />

			<ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
		</div>
	);
}

/**
 * A group's whole schedule (`GET /teach/groups/:id/sessions`) — the group
 * screen's Schedule tab. Tapping a session opens its attendance sheet, which is
 * what a teacher reaches a past or upcoming class for.
 *
 * Lives in `features/schedule` rather than `features/groups` because the rows
 * are sessions: the type and the query belong beside the rest of the schedule
 * surface, and features here never import each other's internals.
 */
export function GroupScheduleTab({ groupId, onOpenSession }: GroupScheduleTabProps) {
	const { data: sessions, isPending, isError } = useGroupSessions(groupId);

	if (isPending) {
		return (
			<div className="flex flex-col gap-2">
				<Skeleton className="h-16 w-full rounded-xl" />
				<Skeleton className="h-16 w-full rounded-xl" />
				<Skeleton className="h-16 w-full rounded-xl" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-xl border border-border bg-card">
				<EmptyState
					icon={<CalendarX />}
					title="Couldn't load the schedule"
					description="Something went wrong fetching this group's sessions. Try again in a moment."
				/>
			</div>
		);
	}

	if (sessions.length === 0) {
		return (
			<div className="rounded-xl border border-border bg-card">
				<EmptyState
					icon={<CalendarX />}
					title="No sessions scheduled"
					description="Sessions are generated from the group's weekly schedule once it has a start and end date."
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{sessions.map((session) => (
				<SessionRow
					key={session.id}
					session={session}
					onOpen={() => onOpenSession(session.id)}
				/>
			))}
		</div>
	);
}
