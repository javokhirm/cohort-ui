import { cn } from '@repo/ui';
import { formatDayOfMonth, formatWeekday } from '@repo/utils';

import type { StudentSession } from '../api/sessions.queries';
import { groupTone } from '../lib/group-tone';

const DOT_TONE_CLASS: Record<string, string> = {
	indigo: 'bg-tone-indigo-fg',
	cyan: 'bg-tone-cyan-fg',
	violet: 'bg-tone-violet-fg',
	blue: 'bg-tone-blue-fg',
	pink: 'bg-tone-pink-fg',
	orange: 'bg-tone-orange-fg',
};

interface WeekStripProps {
	/** The seven Monday→Sunday dates of the visible week (`YYYY-MM-DD`). */
	dates: string[];
	selectedDate: string;
	/** The center's today, to ring the current day. */
	today: string;
	/** The whole loaded week's sessions — up to three per-group dots per day. */
	weekSessions: StudentSession[];
	onSelect: (date: string) => void;
}

/**
 * The seven-day picker per the design: each cell shows the weekday, the date and up to
 * three group-coloured dots; the selected day is filled primary, today is outlined.
 * Selecting a day never refetches — the whole week is already loaded.
 */
export function WeekStrip({
	dates,
	selectedDate,
	today,
	weekSessions,
	onSelect,
}: WeekStripProps) {
	return (
		<div className="mt-3 grid grid-cols-7 gap-1.5">
			{dates.map((date) => {
				const isSelected = date === selectedDate;
				const isToday = date === today;
				const daySessions = weekSessions.filter((s) => s.sessionDate === date);

				return (
					<button
						key={date}
						type="button"
						onClick={() => onSelect(date)}
						aria-pressed={isSelected}
						aria-label={date}
						className={cn(
							'flex min-h-14.5 cursor-pointer flex-col items-center gap-1 rounded-[13px] border py-2 transition-colors',
							isSelected
								? 'border-primary bg-primary'
								: isToday
									? 'border-primary bg-card hover:bg-muted'
									: 'border-border bg-card hover:border-primary',
						)}
					>
						<span
							className={cn(
								'text-[9.5px] font-bold uppercase tracking-wide',
								isSelected
									? 'text-primary-foreground/80'
									: isToday
										? 'text-primary'
										: 'text-muted-foreground',
							)}
						>
							{formatWeekday(date)}
						</span>
						<span
							className={cn(
								'text-[15px] font-bold leading-none tabular-nums',
								isSelected
									? 'text-primary-foreground'
									: 'text-foreground',
							)}
						>
							{formatDayOfMonth(date)}
						</span>
						<span className="flex h-1 items-center gap-0.75">
							{daySessions.slice(0, 3).map((s) => (
								<span
									key={s.id}
									className={cn(
										'size-1 rounded-full',
										isSelected
											? 'bg-primary-foreground/90'
											: DOT_TONE_CLASS[groupTone(s.groupId)],
									)}
								/>
							))}
						</span>
					</button>
				);
			})}
		</div>
	);
}
