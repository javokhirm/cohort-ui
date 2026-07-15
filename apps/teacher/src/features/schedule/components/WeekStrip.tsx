import { cn } from '@repo/ui';
import { formatDayOfMonth, formatWeekday } from '@repo/utils';

interface WeekStripProps {
	/** The seven Monday→Sunday dates of the visible week (`YYYY-MM-DD`). */
	dates: string[];
	selectedDate: string;
	/** The center's today, to mark the current day. */
	today: string;
	/** Dates that have at least one (branch-filtered) session — get a dot. */
	datesWithSessions: Set<string>;
	onSelect: (date: string) => void;
}

/**
 * The seven-day week picker. Each day shows its weekday, date, and a dot when it
 * has sessions; the selected day is filled, today is ringed. Tapping a day
 * selects it without refetching — the whole week is already loaded.
 */
export function WeekStrip({
	dates,
	selectedDate,
	today,
	datesWithSessions,
	onSelect,
}: WeekStripProps) {
	return (
		<div className="mb-4 flex gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-xs">
			{dates.map((date) => {
				const isSelected = date === selectedDate;
				const isToday = date === today;
				const hasSessions = datesWithSessions.has(date);

				return (
					<button
						key={date}
						type="button"
						onClick={() => onSelect(date)}
						aria-pressed={isSelected}
						aria-label={date}
						className={cn(
							'flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-xl py-1.5 transition-colors',
							!isSelected && 'hover:bg-muted',
						)}
					>
						<span
							className={cn(
								'text-[10px] font-semibold uppercase tracking-wide',
								isToday && !isSelected
									? 'text-primary'
									: 'text-muted-foreground',
							)}
						>
							{formatWeekday(date)}
						</span>
						<span
							className={cn(
								'flex size-7.5 items-center justify-center rounded-full text-sm font-bold tabular-nums',
								isSelected && 'bg-primary text-primary-foreground',
								!isSelected &&
									isToday &&
									'text-primary ring-1 ring-primary/40',
								!isSelected && !isToday && 'text-foreground',
							)}
						>
							{formatDayOfMonth(date)}
						</span>
						<span
							className={cn(
								'size-1 rounded-full',
								hasSessions
									? isSelected
										? 'bg-primary'
										: 'bg-primary/60'
									: 'bg-transparent',
							)}
						/>
					</button>
				);
			})}
		</div>
	);
}
