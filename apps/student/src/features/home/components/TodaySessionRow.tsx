import { Check, ChevronRight, MapPin } from 'lucide-react';

import { StatusBadge, TONE_CLASSES, cn } from '@repo/ui';
import { useStatusLabel } from '@repo/i18n';
import { formatTime } from '@repo/utils';

import type { StudentSession } from '../api/home.queries';
import { groupTone } from '@/features/schedule/lib/group-tone';
import { clickableCardProps } from '@/lib/clickable-card';
import { useAppT } from '@/locales';

interface TodaySessionRowProps {
	session: StudentSession;
	/** Draws the rail's upper connector — every row but the first. */
	hasBefore: boolean;
	/** Draws the rail's lower connector — every row but the last. */
	hasAfter: boolean;
	/** This is the class running now, or the next one due — the row the hero is about. */
	isNow: boolean;
	onOpen: () => void;
}

/**
 * One stop on Home's timeline for today.
 *
 * The rail is drawn per row rather than as one line behind the list: each row
 * contributes the half-segment above and below its own marker, so the thread
 * stays continuous however tall a row grows, with no absolute offsets to keep in
 * sync with the time column's width.
 *
 * Colour is the group's own (`groupTone`), the same hue the schedule screen keys
 * that group with, so a student learns "the blue one is English" once. It is
 * never the only signal: a finished class fills its marker with a check, one
 * still to come leaves it hollow, and a cancelled class is struck through as
 * well as red. The current class gets a haloed marker and a tinted row — two
 * cues for the one row that matters most.
 *
 * The status pill is shown only for a class that is finished or called off. On a
 * timeline "scheduled" is the baseline every row starts from, so pinning that
 * word to most rows costs about a third of the row's width at 375px — enough to
 * truncate the group name the student actually came to read — while telling them
 * nothing the rail has not already said. The chevron is a pointer affordance
 * only — absent altogether below `sm`, where there is no pointer to show it for
 * and the room and teacher need the width more.
 */
export function TodaySessionRow({
	session,
	hasBefore,
	hasAfter,
	isNow,
	onOpen,
}: TodaySessionRowProps) {
	const t = useAppT('home');
	const statusLabel = useStatusLabel();

	const cancelled = session.status === 'CANCELLED';
	const completed = session.status === 'COMPLETED';
	const tone = cancelled ? 'red' : groupTone(session.groupId);

	return (
		<div
			{...clickableCardProps(onOpen)}
			className={cn(
				'relative flex cursor-pointer items-stretch gap-3 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-4',
				isNow ? 'bg-primary/6' : 'hover:bg-muted/60',
			)}
		>
			<div className="flex w-11 shrink-0 flex-col items-end justify-center py-3.5 text-right">
				<span
					className={cn(
						'text-xs font-semibold tabular-nums',
						completed || cancelled
							? 'text-muted-foreground'
							: 'text-foreground',
					)}
				>
					{formatTime(session.startTime)}
				</span>
				<span className="text-[11px] tabular-nums text-muted-foreground">
					{formatTime(session.endTime)}
				</span>
			</div>

			<div
				aria-hidden="true"
				className="flex w-4 shrink-0 flex-col items-center self-stretch"
			>
				<span className={cn('w-px flex-1', hasBefore && 'bg-border')} />
				<span
					className={cn(
						'relative flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-current',
						TONE_CLASSES[tone],
						completed && 'bg-current',
						isNow && 'ring-4 ring-current/20',
					)}
				>
					{/* The halo inherits `currentColor` from the marker, so it needs no
					    tone class of its own — and no class to merge against. */}
					{isNow && (
						<span className="absolute inset-0 rounded-full bg-current opacity-30" />
					)}
					{completed && <Check className="relative size-2.5 text-card" />}
				</span>
				<span className={cn('w-px flex-1', hasAfter && 'bg-border')} />
			</div>

			<div className="min-w-0 flex-1 py-3.5">
				<div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
					<p
						className={cn(
							'min-w-0 truncate text-sm font-semibold',
							cancelled
								? 'text-muted-foreground line-through'
								: completed
									? 'text-muted-foreground'
									: 'text-foreground',
						)}
					>
						{session.groupName}
					</p>
					{isNow && (
						<span className="shrink-0 rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
							{t('timelineNow')}
						</span>
					)}
				</div>
				{(session.roomName || session.teacherName) && (
					<p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
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
							<span className="truncate">{session.teacherName}</span>
						)}
					</p>
				)}
			</div>

			{(completed || cancelled) && (
				<div className="flex shrink-0 items-center py-3.5">
					<StatusBadge kind="session" status={session.status}>
						{statusLabel('session', session.status)}
					</StatusBadge>
				</div>
			)}

			{/* `display: none` below `sm`, so it costs the row no gap on a phone. */}
			<span
				aria-hidden="true"
				className="hidden shrink-0 items-center py-3.5 sm:flex"
			>
				<ChevronRight className="size-4 text-muted-foreground" />
			</span>
		</div>
	);
}
