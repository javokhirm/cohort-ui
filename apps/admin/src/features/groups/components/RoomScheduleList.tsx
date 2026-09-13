import { AlertTriangle, Users } from 'lucide-react';

import { cn, resolveStatus, StatusBadge, TONE_ACCENT_CLASSES } from '@repo/ui';
import { useStatusLabel } from '@repo/i18n';
import { useAppT } from '@/locales';

import type { AllocationRow } from '../lib/room-allocation';
import { RoomScheduleRoomLabel } from './RoomScheduleRoomLabel';

interface RoomScheduleListProps {
	rows: AllocationRow[];
	showBranch: boolean;
	onSessionClick?: (sessionId: number) => void;
}

/**
 * The narrow-screen reading of the same day. A time axis needs width the phone
 * does not have, so the timeline gives way to a stacked list: one block per
 * room, its classes underneath in clock order. Nothing is hidden — free rooms
 * and double-bookings read the same, just vertically.
 */
export function RoomScheduleList({
	rows,
	showBranch,
	onSessionClick,
}: RoomScheduleListProps) {
	const t = useAppT('groups');
	const statusLabel = useStatusLabel();

	return (
		<div className="flex flex-col gap-2">
			{rows.map((row) => (
				<div
					key={row.key}
					className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
				>
					<div className="border-b border-border px-3 py-2">
						<RoomScheduleRoomLabel row={row} showBranch={showBranch} />
					</div>

					{row.blocks.length === 0 ? (
						<p className="px-3 py-3 text-xs text-muted-foreground">
							{t('schedule.rooms.free')}
						</p>
					) : (
						<ul className="divide-y divide-border">
							{row.blocks.map(({ booking }) => {
								const { tone } = resolveStatus('session', booking.status);
								return (
									<li key={booking.sessionId}>
										<button
											type="button"
											onClick={() =>
												onSessionClick?.(booking.sessionId)
											}
											className={cn(
												'flex w-full items-start gap-3 border-l-[3px] px-3 py-2.5 text-left transition-colors hover:bg-muted/50',
												'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
												TONE_ACCENT_CLASSES[tone].borderLeft,
												booking.status === 'CANCELLED' &&
													'opacity-60',
											)}
										>
											<span className="w-24 shrink-0 text-xs font-semibold tabular-nums text-foreground">
												{booking.startTime}–{booking.endTime}
											</span>
											<span className="flex min-w-0 flex-1 flex-col gap-0.5">
												<span className="truncate text-sm font-semibold">
													{booking.groupName}
												</span>
												<span className="truncate text-xs text-muted-foreground">
													{[
														booking.teacherName,
														t('schedule.rooms.students', {
															count: booking.studentCount,
														}),
													]
														.filter(Boolean)
														.join(' · ')}
												</span>
												<span className="flex flex-wrap items-center gap-1.5 pt-0.5">
													<StatusBadge
														kind="session"
														status={booking.status}
													>
														{statusLabel(
															'session',
															booking.status,
														)}
													</StatusBadge>
													{booking.conflict && (
														<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
															<AlertTriangle className="size-3" />
															{t('schedule.rooms.conflict')}
														</span>
													)}
													{booking.overCapacity && (
														<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tone-amber-fg">
															<Users className="size-3" />
															{t(
																'schedule.rooms.overCapacity',
															)}
														</span>
													)}
												</span>
											</span>
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			))}
		</div>
	);
}
