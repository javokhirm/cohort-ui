import { MapPin } from 'lucide-react';

import { AccentCard, cn, StatusBadge } from '@repo/ui';
import { formatTime } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import type { StudentSession } from '../api/sessions.queries';
import { groupTone } from '../lib/group-tone';
import { useAppT } from '@/locales';

interface DaySessionCardProps {
	session: StudentSession;
	/** Happening right now — shows the pulsing "Live now" badge. */
	isLive: boolean;
	/** The session's end time has passed (dimmed, "Finished" badge when still SCHEDULED). */
	isPast: boolean;
	onOpen: () => void;
}

/**
 * One session in the selected day's list, per the design: a group-coloured accent bar,
 * a time block, the status badge (live sessions pulse), room · teacher and the topic.
 * Cancelled sessions get a red-tinted border; finished ones dim.
 */
export function DaySessionCard({ session, isLive, isPast, onOpen }: DaySessionCardProps) {
	const t = useAppT('schedule');
	const statusLabel = useStatusLabel();
	const isCancelled = session.status === 'CANCELLED';

	return (
		<AccentCard
			tone={groupTone(session.groupId)}
			onClick={onOpen}
			className={cn(
				'cursor-pointer rounded-[13px] p-3.5 transition-colors hover:border-primary',
				isCancelled && 'border-tone-red-fg/40',
				isPast && !isLive && 'opacity-70',
			)}
		>
			<div className="flex items-start gap-3">
				<div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted py-2">
					<span className="text-[14.5px] font-bold tabular-nums text-foreground">
						{formatTime(session.startTime)}
					</span>
					<span className="text-[10px] tabular-nums text-muted-foreground">
						{formatTime(session.endTime)}
					</span>
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<span className="truncate text-sm font-bold text-foreground">
							{session.groupName}
						</span>
						{isLive ? (
							<StatusBadge tone="green" className="shrink-0">
								<span className="size-1.5 animate-pulse rounded-full bg-current" />
								{t('liveNow')}
							</StatusBadge>
						) : isPast && session.status === 'SCHEDULED' ? (
							<StatusBadge tone="slate" className="shrink-0">
								{t('finished')}
							</StatusBadge>
						) : (
							<StatusBadge
								kind="session"
								status={session.status}
								className="shrink-0"
							>
								{statusLabel('session', session.status)}
							</StatusBadge>
						)}
					</div>
					<div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
						{session.roomName && (
							<span className="flex items-center gap-1">
								<MapPin className="size-3" />
								{session.roomName}
							</span>
						)}
						{session.roomName && session.teacherName && (
							<span className="size-0.75 shrink-0 rounded-full bg-muted-foreground/40" />
						)}
						{session.teacherName && <span>{session.teacherName}</span>}
					</div>
					{session.topic && (
						<div className="mt-1.5 truncate text-xs text-foreground/70">
							{session.topic}
						</div>
					)}
				</div>
			</div>
		</AccentCard>
	);
}
