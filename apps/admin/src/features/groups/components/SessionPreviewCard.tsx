import { formatShortDate } from '@repo/utils';
import type { ScheduleDay } from '../api/groups.queries';
import { hhmm } from '../lib/group-options';
import { generateSessionDates } from '../lib/session-preview';

interface SessionPreviewCardProps {
	days: ScheduleDay[];
	startDate?: string;
	endDate?: string;
	startTime: string;
}

/** Live read-out of the sessions a schedule rule + date range will generate. */
export function SessionPreviewCard({
	days,
	startDate,
	endDate,
	startTime,
}: SessionPreviewCardProps) {
	const dates = generateSessionDates(days, startDate, endDate);

	return (
		<div className="flex h-fit flex-col rounded-xl border border-border bg-card shadow-xs">
			<div className="p-4">
				<span className="text-sm font-semibold">Session preview</span>
				<p className="text-xs text-muted-foreground">
					{dates.length > 0 ? (
						<>
							This rule generates{' '}
							<span className="font-semibold text-primary">
								{dates.length}
							</span>{' '}
							sessions
						</>
					) : (
						'Pick days and a date range to preview sessions'
					)}
				</p>
			</div>

			{dates.length > 0 && (
				<ul className="flex max-h-96 p-4 flex-col gap-2 overflow-y-auto">
					{dates.map((date) => (
						<li
							key={date}
							className="flex items-center justify-between text-sm text-foreground"
						>
							<span className="flex items-center gap-2">
								<span className="size-1.5 shrink-0 rounded-full bg-primary/50" />
								{formatShortDate(date)}
							</span>
							<span className="tabular-nums text-muted-foreground">
								{hhmm(startTime)}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
