import { useState } from 'react';
import { CalendarDays, MapPin, UserCog } from 'lucide-react';

import { Card, EmptyState, Skeleton, StatusBadge } from '@repo/ui';
import { formatDate } from '@repo/utils';

import { useGroupSessions, type SessionCalendarItem } from '../api/groups.queries';
import { hhmm } from '../lib/group-options';
import { SessionDetailSheet } from './SessionDetailSheet';

interface GroupSessionsSectionProps {
	groupId: number;
}

export function GroupSessionsSection({ groupId }: GroupSessionsSectionProps) {
	const { data: sessions = [], isLoading } = useGroupSessions(groupId);
	const [openSessionId, setOpenSessionId] = useState<number | null>(null);

	const sorted = [...sessions].sort((a, b) =>
		`${a.sessionDate}${a.startTime}`.localeCompare(`${b.sessionDate}${b.startTime}`),
	);

	return (
		<div className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold">
				Sessions{' '}
				<span className="text-muted-foreground">· {sessions.length}</span>
			</h2>

			{isLoading ? (
				<Card className="gap-0 divide-y divide-border py-0">
					{[1, 2, 3].map((i) => (
						<div key={i} className="px-4 py-3.5">
							<Skeleton className="h-9 w-full" />
						</div>
					))}
				</Card>
			) : sorted.length === 0 ? (
				<Card className="py-0">
					<EmptyState
						icon={<CalendarDays />}
						title="No sessions yet"
						description="Set a start date, end date and weekly schedule on the group to generate sessions."
					/>
				</Card>
			) : (
				<Card className="gap-0 divide-y divide-border py-0">
					{sorted.map((s) => (
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
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted"
		>
			<div className="flex items-center gap-3">
				<div className="flex w-16 flex-col items-center rounded-lg bg-muted px-2 py-1.5">
					<span className="text-xs font-semibold tabular-nums">
						{hhmm(session.startTime)}
					</span>
					<span className="text-[10px] text-muted-foreground">
						{formatDate(session.sessionDate)}
					</span>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-sm font-medium">
						{session.topic ?? 'Session'}
					</span>
					<span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<MapPin className="size-3" />
							{session.roomName ?? 'No room'}
						</span>
						<span className="flex items-center gap-1">
							<UserCog className="size-3" />
							{session.teacherName ?? 'Unassigned'}
						</span>
					</span>
				</div>
			</div>
			<StatusBadge kind="session" status={session.status} />
		</button>
	);
}
