import { AlertTriangle, Users } from 'lucide-react';

import {
	cn,
	resolveStatus,
	TONE_ACCENT_CLASSES,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@repo/ui';
import { useStatusLabel } from '@repo/i18n';
import { useAppT } from '@/locales';

import {
	blockGeometry,
	hourLabel,
	type AllocationBlock,
	type AllocationRow,
	type AllocationWindow,
} from '../lib/room-allocation';
import { RoomScheduleRoomLabel } from './RoomScheduleRoomLabel';

/**
 * Geometry Tailwind can't express, because it depends on the data: lane heights
 * scale with how deep a room's classes stack, and a block's offset and width are
 * a percentage of the visible hour window. Everything else stays in classes.
 */
const LANE_HEIGHT = 40;
const BLOCK_HEIGHT = 34;
const ROW_PADDING = 10;
/** Room-column width (`w-52`) and the narrowest an hour may get, for scroll width. */
const LABEL_WIDTH = 208;
const MIN_HOUR_WIDTH = 76;

interface RoomAllocationGridProps {
	rows: AllocationRow[];
	window: AllocationWindow;
	/** Where "now" falls across the window (0–100), or null when off-screen. */
	nowPercent: number | null;
	showBranch: boolean;
	onSessionClick?: (sessionId: number) => void;
}

export function RoomAllocationGrid({
	rows,
	window,
	nowPercent,
	showBranch,
	onSessionClick,
}: RoomAllocationGridProps) {
	const t = useAppT('groups');
	const statusLabel = useStatusLabel();

	/** Everything about a class, for the tooltip and the accessible name. */
	function details(block: AllocationBlock): string {
		const { booking } = block;
		return [
			`${booking.startTime}–${booking.endTime}`,
			booking.groupName,
			booking.courseName,
			booking.teacherName,
			t('schedule.rooms.students', { count: booking.studentCount }),
			statusLabel('session', booking.status),
			booking.conflict ? t('schedule.rooms.conflict') : null,
			booking.overCapacity ? t('schedule.rooms.overCapacity') : null,
		]
			.filter(Boolean)
			.join(' · ');
	}

	return (
		// Both axes are pinned inside this one scroll box: the hour header stays
		// put as the room list scrolls, and the room column as the day scrolls.
		<div className="max-h-[70vh] overflow-auto rounded-2xl border border-border bg-card shadow-sm">
			<div
				className="min-w-full"
				style={{ width: LABEL_WIDTH + window.hours.length * MIN_HOUR_WIDTH }}
			>
				{/* Hour axis — each column is labelled by the hour it starts. */}
				<div className="sticky top-0 z-30 flex border-b border-border bg-muted">
					<div className="sticky left-0 z-40 w-52 shrink-0 border-r border-border bg-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						{t('schedule.rooms.roomColumn')}
					</div>
					<div className="relative flex flex-1">
						{window.hours.map((hour) => (
							<div
								key={hour}
								className="flex-1 border-l border-border px-1.5 py-2 text-[11px] font-medium tabular-nums text-muted-foreground first:border-l-0"
							>
								{hourLabel(hour)}
							</div>
						))}
						{nowPercent !== null && (
							<span
								className="pointer-events-none absolute bottom-0.5 -translate-x-1/2 rounded-sm bg-primary px-1 py-px text-[10px] font-bold text-primary-foreground"
								style={{ left: `${nowPercent}%` }}
							>
								{t('schedule.rooms.now')}
							</span>
						)}
					</div>
				</div>

				{rows.map((row) => (
					<div
						key={row.key}
						className="flex border-b border-border last:border-b-0"
					>
						{/* Opaque, so it covers the track it scrolls over. */}
						<div className="sticky left-0 z-20 flex w-52 shrink-0 flex-col justify-center border-r border-border bg-card px-3 py-2">
							<RoomScheduleRoomLabel row={row} showBranch={showBranch} />
						</div>

						<div
							className={cn(
								'relative flex-1',
								row.roomId === null
									? 'bg-tone-amber-bg/30'
									: row.blocks.length === 0 && 'bg-muted/30',
							)}
							style={{
								height: Math.max(
									row.laneCount * LANE_HEIGHT + ROW_PADDING,
									64,
								),
							}}
						>
							{/* Hour gridlines, aligned with the axis above. */}
							<div className="pointer-events-none absolute inset-0 flex">
								{window.hours.map((hour) => (
									<div
										key={hour}
										className="flex-1 border-l border-border/60 first:border-l-0"
									/>
								))}
							</div>

							{nowPercent !== null && (
								<div
									className="pointer-events-none absolute inset-y-0 z-10 w-px bg-primary"
									style={{ left: `${nowPercent}%` }}
								/>
							)}

							{row.blocks.map((block) => {
								const { booking } = block;
								const { tone } = resolveStatus('session', booking.status);
								const accent = TONE_ACCENT_CLASSES[tone];
								const { left, width } = blockGeometry(block, window);
								const label = details(block);
								return (
									<Tooltip key={booking.sessionId}>
										<TooltipTrigger asChild>
											<button
												type="button"
												onClick={() =>
													onSessionClick?.(booking.sessionId)
												}
												aria-label={label}
												className={cn(
													'absolute z-10 overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left transition-[filter,box-shadow] hover:brightness-95',
													'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
													accent.bg,
													accent.borderLeft,
													booking.conflict &&
														'ring-2 ring-destructive',
													booking.status === 'CANCELLED' &&
														'opacity-60 line-through decoration-1',
												)}
												style={{
													left,
													width,
													top: block.lane * LANE_HEIGHT + 4,
													height: BLOCK_HEIGHT,
												}}
											>
												<span className="flex items-center gap-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
													{booking.conflict && (
														<AlertTriangle className="size-3 shrink-0 text-destructive" />
													)}
													{booking.overCapacity && (
														<Users className="size-3 shrink-0 text-tone-amber-fg" />
													)}
													<span className="truncate">
														{booking.startTime}–
														{booking.endTime}
													</span>
												</span>
												<span className="block truncate text-[11px] font-semibold text-foreground">
													{booking.groupName}
												</span>
											</button>
										</TooltipTrigger>
										<TooltipContent side="top" className="max-w-xs">
											{label}
										</TooltipContent>
									</Tooltip>
								);
							})}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
