import { Flame } from 'lucide-react';

import { Card, cn, Separator } from '@repo/ui';
import { formatShortDate } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import type {
	AttendanceStatus,
	StudentAttendanceSummary,
} from '../api/attendance.queries';
import { useAppT } from '@/locales';

const STATUS_DOT_CLASS: Record<AttendanceStatus, string> = {
	PRESENT: 'bg-tone-green-fg',
	LATE: 'bg-tone-amber-fg',
	ABSENT: 'bg-tone-red-fg',
	EXCUSED: 'bg-tone-slate-fg',
};

const STRIP_CELL_CLASS: Record<AttendanceStatus, string> = {
	PRESENT: 'bg-tone-green-bg',
	LATE: 'bg-tone-amber-bg',
	ABSENT: 'border border-tone-red-fg bg-tone-red-bg',
	EXCUSED: 'bg-tone-slate-bg',
};

interface AttendanceSummaryCardProps {
	summary: StudentAttendanceSummary;
	/**
	 * What the figures cover — the selected group's name, or "all groups". The
	 * group filter chips drive this card alongside the mark average and the log,
	 * so the subtitle has to say which scope the rate belongs to.
	 */
	scopeLabel: string;
}

/**
 * The Progress screen's attendance card per the design: the rate ring, per-status
 * counts, a streak banner (when a streak is running) and the recent-classes strip.
 */
export function AttendanceSummaryCard({
	summary,
	scopeLabel,
}: AttendanceSummaryCardProps) {
	const t = useAppT('progress');
	const statusLabel = useStatusLabel();
	const rate = summary.rate;

	const ringColor =
		rate === null
			? 'var(--color-tone-slate-fg)'
			: rate >= 85
				? 'var(--color-tone-green-fg)'
				: rate >= 70
					? 'var(--color-tone-amber-fg)'
					: 'var(--color-tone-red-fg)';

	const counts: { status: AttendanceStatus; n: number }[] = [
		{ status: 'PRESENT', n: summary.counts.present },
		{ status: 'LATE', n: summary.counts.late },
		{ status: 'ABSENT', n: summary.counts.absent },
		{ status: 'EXCUSED', n: summary.counts.excused },
	];

	const strip = [...summary.recent].reverse();

	return (
		<Card className="gap-0 rounded-[17px] py-0">
			<div className="p-4">
				<div className="flex items-center gap-4">
					{/* Dynamic ring fill — same inline-value precedent as ProgressBar's width. */}
					<div
						className="flex size-19 shrink-0 items-center justify-center rounded-full"
						style={{
							background: `conic-gradient(${ringColor} ${((rate ?? 0) / 100) * 360}deg, var(--color-muted) 0)`,
						}}
					>
						<div className="flex size-14.5 items-center justify-center rounded-full bg-card">
							<span className="text-[17px] font-extrabold tabular-nums text-foreground">
								{rate === null ? '—' : `${rate}%`}
							</span>
						</div>
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-[13.5px] font-bold text-foreground">
							{t('attendanceRateTitle')}
						</p>
						<p className="mb-2 mt-px text-xs text-muted-foreground">
							{t('attendanceRateSub', { scope: scopeLabel })}
						</p>
						<div className="flex flex-wrap gap-x-2.5 gap-y-1">
							{counts.map(({ status, n }) => (
								<span
									key={status}
									className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-foreground/70"
								>
									<span
										className={cn(
											'size-2 rounded-full',
											STATUS_DOT_CLASS[status],
										)}
									/>
									{n} {statusLabel('attendance', status).toLowerCase()}
								</span>
							))}
						</div>
					</div>
				</div>

				{summary.streak > 0 && (
					<div className="mt-4 flex items-center gap-2.5 rounded-xl bg-tone-orange-bg px-3 py-2.5">
						<Flame className="size-4 shrink-0 text-tone-orange-fg" />
						<div className="min-w-0">
							<p className="text-[12.5px] font-bold text-foreground">
								{t('streakTitle', { count: summary.streak })}
							</p>
							<p className="mt-px text-[11.5px] text-muted-foreground">
								{t('streakSub')}
							</p>
						</div>
					</div>
				)}

				{strip.length > 0 && (
					<>
						<Separator className="my-3.5" />
						<p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
							{t('lastClasses', { count: strip.length })}
						</p>
						<div className="flex gap-1">
							{strip.map((r, i) => (
								<span
									key={`${r.sessionDate}-${i}`}
									title={`${formatShortDate(r.sessionDate)} · ${statusLabel('attendance', r.status)}`}
									className={cn(
										'h-7.5 flex-1 rounded-[7px]',
										STRIP_CELL_CLASS[r.status],
									)}
								/>
							))}
						</div>
						<div className="mt-1.5 flex justify-between text-[10.5px] text-muted-foreground">
							<span>{formatShortDate(strip[0]!.sessionDate)}</span>
							<span>
								{formatShortDate(strip[strip.length - 1]!.sessionDate)}
							</span>
						</div>
					</>
				)}
			</div>
		</Card>
	);
}
