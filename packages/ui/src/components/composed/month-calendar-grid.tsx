import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

export interface MonthCalendarDay {
	date: Date;
	/** Whether this cell belongs to the displayed month (vs. leading/trailing overflow). */
	inCurrentMonth: boolean;
	sessionCount: number;
}

interface MonthCalendarGridProps extends React.ComponentProps<'div'> {
	/** Full weeks (each exactly 7 entries, Mon–Sun) covering the displayed month. */
	weeks: MonthCalendarDay[][];
	onDayClick?: (date: Date) => void;
}

const DOW_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function isToday(date: Date): boolean {
	const today = new Date();
	return (
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate()
	);
}

function MonthCalendarGrid({
	className,
	weeks,
	onDayClick,
	...props
}: MonthCalendarGridProps) {
	return (
		<div
			data-slot="month-calendar-grid"
			className={cn(
				'overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
				className,
			)}
			{...props}
		>
			<div className="grid grid-cols-7 border-b border-border">
				{DOW_HEADERS.map((d, i) => (
					<div
						key={d}
						className={cn(
							'py-2 text-center text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground',
							i >= 5 && 'bg-muted/40',
						)}
					>
						{d}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7">
				{weeks.map((week) =>
					week.map((day, i) => {
						const today = isToday(day.date);
						return (
							<button
								key={`${day.date.toDateString()}-${i}`}
								type="button"
								onClick={() => onDayClick?.(day.date)}
								className={cn(
									'flex min-h-[84px] flex-col gap-1.5 border-r border-b border-border p-2 text-left last:border-r-0',
									!day.inCurrentMonth && 'bg-muted/30',
									'hover:bg-muted/50',
								)}
							>
								<div className="flex items-center justify-between">
									<span
										className={cn(
											'text-xs font-semibold tabular-nums',
											day.inCurrentMonth
												? 'text-foreground'
												: 'text-muted-foreground/60',
										)}
									>
										{day.date.getDate()}
									</span>
									{today && (
										<span className="size-1.5 rounded-full bg-primary" />
									)}
								</div>
								{day.sessionCount > 0 && (
									<span className="w-fit rounded-md bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-primary">
										{day.sessionCount}{' '}
										{day.sessionCount === 1 ? 'session' : 'sessions'}
									</span>
								)}
							</button>
						);
					}),
				)}
			</div>
		</div>
	);
}

export { MonthCalendarGrid };
export type { MonthCalendarGridProps };
