import { CalendarDays, MapPin } from 'lucide-react';

import { Card, EmptyState, Separator, StatusBadge } from '@repo/ui';
import { formatTime } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import type { StudentSession } from '../api/home.queries';
import { useAppT } from '@/locales';

interface TodaySessionListProps {
	sessions: StudentSession[];
	/** Opens a session's detail screen. */
	onOpenSession: (sessionId: number) => void;
}

/**
 * Today's sessions as a single timeline card (time · group · badge per row), matching the
 * design's Home screen. Loading/error for the whole Home screen is handled one level up by
 * `routes/home.tsx` — this component only needs its own empty state. Read-only: no
 * attendance/marks actions, those belong to the teacher console.
 */
export function TodaySessionList({ sessions, onOpenSession }: TodaySessionListProps) {
	const t = useAppT('home');
	const statusLabel = useStatusLabel();

	if (sessions.length === 0) {
		return (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<CalendarDays />}
					title={t('todayEmptyTitle')}
					description={t('todayEmptyDescription')}
				/>
			</div>
		);
	}

	return (
		<Card className="gap-0 py-1.5">
			{sessions.map((session, i) => (
				<div key={session.id}>
					{i > 0 && <Separator />}
					<div
						role="button"
						tabIndex={0}
						onClick={() => onOpenSession(session.id)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') onOpenSession(session.id);
						}}
						className="flex cursor-pointer items-center gap-3.5 px-4 py-3 transition-colors hover:bg-muted/60"
					>
						<div className="flex w-13 shrink-0 flex-col items-end text-right">
							<span className="text-[13.5px] font-bold tabular-nums text-foreground">
								{formatTime(session.startTime)}
							</span>
							<span className="text-[10.5px] tabular-nums text-muted-foreground">
								{formatTime(session.endTime)}
							</span>
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-[13.5px] font-semibold text-foreground">
								{session.groupName}
							</p>
							<p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-muted-foreground">
								{session.roomName && (
									<span className="flex shrink-0 items-center gap-0.5">
										<MapPin className="size-3" />
										{session.roomName}
									</span>
								)}
								{session.roomName && session.teacherName && (
									<span className="size-0.75 shrink-0 rounded-full bg-muted-foreground/40" />
								)}
								{session.teacherName && (
									<span className="truncate">
										{session.teacherName}
									</span>
								)}
							</p>
						</div>
						<StatusBadge
							kind="session"
							status={session.status}
							className="shrink-0"
						>
							{statusLabel('session', session.status)}
						</StatusBadge>
					</div>
				</div>
			))}
		</Card>
	);
}
