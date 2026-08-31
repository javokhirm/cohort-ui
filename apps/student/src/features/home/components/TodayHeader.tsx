import { CalendarDays, ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { cn } from '@repo/ui';
import { formatShortDate, todayIsoDate } from '@repo/utils';

import type { DayProgress } from '../lib/day-progress';
import { useAppT } from '@/locales';

interface TodayHeaderProps {
	progress: DayProgress;
}

/**
 * The heading over today's timeline, and the screen's only progress meter.
 *
 * "2 of 3 done" is the single loop on Home a student closes within the day
 * itself — the streak and the attendance rate move over weeks — which is exactly
 * why it earns a meter. It is derived from statuses the endpoint already sent
 * (see `lib/day-progress.ts`), never estimated.
 *
 * The meter is segmented rather than `@repo/ui`'s `ProgressBar`, and that is a
 * difference in information, not in styling: one pill per attendable class today
 * lets a student count what is left ("one more") instead of reading a fraction
 * of a bar. A day holds a handful of classes at most, and the pills are
 * `flex-1`, so the meter scales itself down on the rare crowded day. Where the
 * screen genuinely shows a proportion of a continuous whole — a running class,
 * an attendance rate — it uses the shared `ProgressBar`.
 *
 * The meter is hidden on a day with nothing attendable: an empty track reading
 * "0/0" is noise, not information.
 */
export function TodayHeader({ progress }: TodayHeaderProps) {
	const t = useAppT('home');
	const complete = progress.total > 0 && progress.done === progress.total;

	return (
		<div className="mb-3">
			<div className="flex items-center justify-between gap-2">
				<h2 className="flex min-w-0 items-center gap-2">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-tone-indigo-bg text-tone-indigo-fg">
						<CalendarDays className="size-4" />
					</span>
					<span className="min-w-0">
						<span className="block text-sm font-bold leading-tight text-foreground">
							{t('todaySectionTitle')}
						</span>
						<span className="block truncate text-xs text-muted-foreground">
							{formatShortDate(todayIsoDate())}
						</span>
					</span>
				</h2>
				<Link
					to="/schedule"
					className="flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
				>
					{t('fullSchedule')}
					<ChevronRight className="size-3.5" />
				</Link>
			</div>

			{progress.total > 0 && (
				<div className="mt-2.5 flex items-center gap-2.5">
					<div className="flex flex-1 items-center gap-1">
						{Array.from({ length: progress.total }, (_, i) => (
							<span
								key={i}
								className={cn(
									'h-1.5 flex-1 rounded-full',
									i >= progress.done
										? 'bg-border'
										: complete
											? 'bg-tone-green-fg'
											: 'bg-primary',
								)}
							/>
						))}
					</div>
					<span
						className={cn(
							'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
							complete
								? 'bg-tone-green-bg text-tone-green-fg'
								: 'bg-card text-muted-foreground',
						)}
					>
						{t('dayProgress', {
							done: progress.done,
							total: progress.total,
						})}
					</span>
				</div>
			)}
		</div>
	);
}
