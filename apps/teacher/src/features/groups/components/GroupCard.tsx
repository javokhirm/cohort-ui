import type { KeyboardEvent } from 'react';
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react';

import { branchDotClass, cn } from '@repo/ui';

import type { TeachGroup } from '../api/groups.queries';
import { attendanceToneClass, capacityLabel, capacityToneClass } from '../lib/capacity';

interface GroupCardProps {
	group: TeachGroup;
	/** Branch name for the footer dot. Omit to hide the branch line entirely. */
	branchName?: string;
	onOpen: () => void;
}

/**
 * One group in the teacher's group grid. The whole card is the tap target — it
 * opens the group's attendance, which is what a teacher reaches for.
 *
 * `attendanceRate` is `null` until something is marked; that renders as "No
 * attendance yet", never as 0% — a group nobody has marked is not a group with
 * perfect absence.
 */
export function GroupCard({ group, branchName, onOpen }: GroupCardProps) {
	const rule = group.scheduleRule;
	const filledLabel = capacityLabel(group.activeEnrollmentsCount, group.capacity);

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
			className="cursor-pointer rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary active:bg-muted/60 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
		>
			<div className="flex items-start gap-2.5">
				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<span className="truncate text-[16px] font-bold text-foreground">
							{group.name}
						</span>
						<span className="flex shrink-0 items-center gap-0.5">
							<span
								className={cn(
									'text-[12px] font-bold tabular-nums',
									capacityToneClass(
										group.activeEnrollmentsCount,
										group.capacity,
									),
								)}
							>
								{filledLabel}
							</span>
							<ChevronRight className="size-3.5 text-muted-foreground/50" />
						</span>
					</div>
					<div className="mt-0.5 truncate text-[12px] text-muted-foreground">
						{group.courseName}
					</div>
				</div>
			</div>

			{(rule ?? group.roomName) && (
				<div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
					{rule && (
						<>
							<span className="inline-flex items-center gap-1">
								<CalendarDays className="size-3 shrink-0" />
								{rule.days.join('/')}
							</span>
							<span className="size-0.75 rounded-full bg-muted-foreground/40" />
							<span className="tabular-nums">
								{rule.startTime}–{rule.endTime}
							</span>
						</>
					)}
					{rule && group.roomName && (
						<span className="size-0.75 rounded-full bg-muted-foreground/40" />
					)}
					{group.roomName && (
						<span className="inline-flex items-center gap-1">
							<MapPin className="size-3 shrink-0" />
							{group.roomName}
						</span>
					)}
				</div>
			)}

			<div className="mt-2.75 flex items-center justify-between gap-2 border-t border-border pt-2.75">
				{branchName ? (
					<span className="inline-flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted-foreground">
						<span
							className={cn(
								'size-1.75 shrink-0 rounded-full',
								branchDotClass(group.branchId),
							)}
						/>
						<span className="truncate">{branchName}</span>
					</span>
				) : (
					<span />
				)}

				{group.attendanceRate === null ? (
					<span className="shrink-0 text-[11.5px] text-muted-foreground">
						No attendance yet
					</span>
				) : (
					<span
						className={cn(
							'shrink-0 text-[11.5px] font-semibold tabular-nums',
							attendanceToneClass(group.attendanceRate),
						)}
					>
						{group.attendanceRate}% attendance
					</span>
				)}
			</div>
		</div>
	);
}
