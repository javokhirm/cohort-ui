import { formatShortDate } from '@repo/utils';
import type { ScheduleDay } from '../api/groups.queries';
import { formatScheduleRule } from '../lib/group-options';
import { generateSessionDates } from '../lib/session-preview';
import { useAppT } from '@/locales';

interface SessionPreviewCardProps {
	days: ScheduleDay[];
	startDate?: string;
	endDate?: string;
	startTime: string;
	endTime: string;
}

/**
 * How many dates the card lists. A year-long rule generates hundreds of
 * sessions; the count in the header is the answer the admin needs, and the list
 * is only there to confirm the rule lands on the right days — so it shows the
 * first few and counts the rest instead of rendering the lot.
 */
const PREVIEW_LIMIT = 12;

/** Live read-out of the sessions a schedule rule + date range will generate. */
export function SessionPreviewCard({
	days,
	startDate,
	endDate,
	startTime,
	endTime,
}: SessionPreviewCardProps) {
	const t = useAppT('groups');
	const dates = generateSessionDates(days, startDate, endDate);
	const shown = dates.slice(0, PREVIEW_LIMIT);
	const hidden = dates.length - shown.length;
	// Every generated session runs at the same time, so the rule is stated once
	// here instead of repeated on each row.
	const rule = formatScheduleRule(t, { days, startTime, endTime });

	return (
		<div className="flex h-fit flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:sticky lg:top-0">
			<div className="flex flex-col gap-0.5 p-4">
				<span className="text-sm font-semibold">{t('form.previewTitle')}</span>
				<p className="text-xs text-muted-foreground">
					{dates.length > 0
						? t('form.previewCount', { count: dates.length })
						: t('form.previewEmpty')}
				</p>
				{rule && <p className="text-xs tabular-nums text-foreground">{rule}</p>}
			</div>

			{dates.length > 0 && (
				<ul className="flex flex-col gap-2 border-t border-border px-4 py-3">
					{shown.map((date) => (
						<li
							key={date}
							className="flex items-center gap-2 text-sm text-foreground"
						>
							<span className="size-1.5 shrink-0 rounded-full bg-primary/50" />
							<span className="truncate">{formatShortDate(date)}</span>
						</li>
					))}
					{hidden > 0 && (
						<li className="pt-1 text-xs text-muted-foreground">
							{t('form.previewMore', { count: hidden })}
						</li>
					)}
				</ul>
			)}
		</div>
	);
}
