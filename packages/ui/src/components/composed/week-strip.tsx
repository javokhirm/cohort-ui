import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export interface WeekDay {
	date: Date;
	/** Show a dot indicator below the date number (signals "has events"). */
	hasEvents?: boolean;
}

interface WeekStripProps extends Omit<React.ComponentProps<'div'>, 'onSelect'> {
	days: WeekDay[];
	selectedDate?: Date;
	onSelect?: (date: Date) => void;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function isSameDay(a: Date, b: Date) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

function WeekStrip({
	className,
	days,
	selectedDate,
	onSelect,
	...props
}: WeekStripProps) {
	const today = new Date();
	return (
		<div
			data-slot="week-strip"
			className={cn(
				'flex gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm',
				className,
			)}
			{...props}
		>
			{days.map((d, i) => {
				const isSelected = selectedDate ? isSameDay(d.date, selectedDate) : false;
				const isToday = isSameDay(d.date, today);
				return (
					<button
						key={i}
						type="button"
						onClick={() => onSelect?.(d.date)}
						className={cn(
							'flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-colors',
							isSelected
								? 'bg-primary text-primary-foreground'
								: 'hover:bg-muted',
						)}
					>
						<span
							className={cn(
								'text-[10px] font-semibold uppercase tracking-wider',
								isSelected
									? 'text-primary-foreground/80'
									: 'text-muted-foreground',
							)}
						>
							{DOW[d.date.getDay()]}
						</span>
						<span
							className={cn(
								'text-[15px] font-bold tabular-nums',
								isSelected
									? 'text-primary-foreground'
									: isToday
										? 'text-primary'
										: 'text-foreground',
							)}
						>
							{d.date.getDate()}
						</span>
						<span
							className={cn(
								'h-1.5 w-1.5 rounded-full',
								d.hasEvents
									? isSelected
										? 'bg-primary-foreground/70'
										: 'bg-primary'
									: 'bg-transparent',
							)}
						/>
					</button>
				);
			})}
		</div>
	);
}

export { WeekStrip };
export type { WeekStripProps };
