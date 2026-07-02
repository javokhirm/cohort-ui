import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';
import { resolveStatus, TONE_ACCENT_CLASSES, type StatusKind } from '@repo/ui/lib/status';

export interface WeekCalendarSession {
	id: number;
	/** "HH:mm" */
	startTime: string;
	groupName: string;
	teacherName?: string | null;
	roomName?: string | null;
	/** Raw backend status value — resolved via `statusKind`. */
	status: string;
}

export interface WeekCalendarDay {
	date: Date;
	sessions: WeekCalendarSession[];
}

interface WeekCalendarGridProps extends React.ComponentProps<'div'> {
	days: WeekCalendarDay[];
	statusKind?: StatusKind;
	onSessionClick?: (session: WeekCalendarSession) => void;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function isToday(date: Date): boolean {
	const today = new Date();
	return (
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate()
	);
}

function WeekCalendarGrid({
	className,
	days,
	statusKind = 'session',
	onSessionClick,
	...props
}: WeekCalendarGridProps) {
	return (
		<div
			data-slot="week-calendar-grid"
			className={cn(
				'grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
				className,
			)}
			style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
			{...props}
		>
			{days.map((day, i) => {
				const today = isToday(day.date);
				return (
					<div
						key={i}
						className="flex min-h-[440px] flex-col border-r border-border last:border-r-0"
					>
						<div
							className={cn(
								'border-b border-border px-2 py-2.5 text-center',
								today && 'bg-primary/5',
							)}
						>
							<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
								{DOW[day.date.getDay()]}
							</div>
							<div
								className={cn(
									'mt-0.5 text-lg font-bold tabular-nums',
									today ? 'text-primary' : 'text-foreground',
								)}
							>
								{day.date.getDate()}
							</div>
						</div>
						<div className="flex flex-1 flex-col gap-1.5 p-1.5">
							{day.sessions.map((s) => {
								const tone = resolveStatus(statusKind, s.status).tone;
								const accent = TONE_ACCENT_CLASSES[tone];
								return (
									<button
										key={s.id}
										type="button"
										onClick={() => onSessionClick?.(s)}
										className={cn(
											'rounded-md border-l-[3px] px-2 py-1.5 text-left text-xs transition-colors hover:brightness-95',
											accent.bg,
											accent.borderLeft,
										)}
									>
										<div className="font-bold tabular-nums text-foreground">
											{s.startTime}
										</div>
										<div className="mt-0.5 truncate font-medium text-foreground/90">
											{s.groupName}
										</div>
										{(s.teacherName || s.roomName) && (
											<div className="mt-0.5 truncate text-[11px] text-muted-foreground">
												{[s.teacherName, s.roomName]
													.filter(Boolean)
													.join(' · ')}
											</div>
										)}
									</button>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}

export { WeekCalendarGrid };
export type { WeekCalendarGridProps };
