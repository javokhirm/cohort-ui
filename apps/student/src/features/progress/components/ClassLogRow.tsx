import { cn, StatusBadge } from '@repo/ui';
import { formatDayOfMonth, formatMonthShort } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import type { ClassLogEntry } from '../api/class-log.queries';
import { MarkChip } from './MarkChip';
import { useAppT } from '@/locales';

interface ClassLogRowProps {
	entry: ClassLogEntry;
	/**
	 * The scale used by the row **below** this one (the next-older class). When it
	 * differs, this row is the boundary of a scale change, so an "Earlier scale"
	 * strip is drawn above it naming what the older marks are measured in.
	 */
	olderScaleName: string | null;
}

/**
 * One class in the log: the date block, the group and topic, the teacher's
 * comment inline, and — on the right — the mark in its native scale over the
 * attendance badge.
 *
 * The three mark states the design distinguishes all come from the same two
 * fields: a mark renders as a chip; no mark on a `PRESENT`/`LATE` class reads
 * "Not marked"; no mark on an `ABSENT`/`EXCUSED` class shows nothing at all,
 * because none was ever expected.
 */
export function ClassLogRow({ entry, olderScaleName }: ClassLogRowProps) {
	const t = useAppT('progress');
	const statusLabel = useStatusLabel();

	const expectedAMark = entry.status === 'PRESENT' || entry.status === 'LATE';
	const initials = entry.mark?.markedByName
		?.split(' ')
		.map((word) => word[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

	return (
		<div
			className={cn(
				'overflow-hidden rounded-[13px] border bg-card shadow-sm',
				entry.status === 'ABSENT' ? 'border-tone-red-fg/40' : 'border-border',
			)}
		>
			{olderScaleName && (
				<div className="flex flex-wrap items-center gap-2 border-b border-dashed border-border bg-muted px-3.5 py-2">
					<span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
						{t('earlierScale')}
					</span>
					<span className="text-[11.5px] text-foreground/70">
						{t('earlierScaleNote', { scale: olderScaleName })}
					</span>
				</div>
			)}

			<div className="flex items-center gap-3 px-3.5 py-3">
				<div className="w-11 shrink-0 text-center">
					<div className="text-[13px] font-bold text-foreground">
						{formatDayOfMonth(entry.sessionDate)}
					</div>
					<div className="text-[10px] text-muted-foreground">
						{formatMonthShort(entry.sessionDate.slice(0, 7))}
					</div>
				</div>
				<div className="w-px self-stretch bg-border" />

				<div className="min-w-0 flex-1">
					<p className="truncate text-[13.5px] font-semibold text-foreground">
						{entry.groupName}
					</p>
					{entry.topic && (
						<p className="mt-px truncate text-[11.5px] text-muted-foreground">
							{entry.topic}
						</p>
					)}
					{entry.note && (
						<p className="mt-px text-[11.5px] text-muted-foreground">
							{entry.note}
						</p>
					)}
					{entry.mark?.comment && (
						<div className="mt-2 flex gap-2 rounded-[10px] bg-muted px-2.5 py-2">
							{initials && (
								<span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-tone-indigo-bg text-[8.5px] font-extrabold text-tone-indigo-fg">
									{initials}
								</span>
							)}
							<p className="text-[11.5px] leading-relaxed text-foreground/70">
								{entry.mark.comment}
							</p>
						</div>
					)}
				</div>

				<div className="flex shrink-0 flex-col items-end gap-1.5">
					{entry.mark ? (
						<MarkChip mark={entry.mark} />
					) : (
						expectedAMark && (
							<span className="text-[11px] font-semibold text-muted-foreground">
								{t('notMarked')}
							</span>
						)
					)}
					<StatusBadge kind="attendance" status={entry.status}>
						{statusLabel('attendance', entry.status)}
					</StatusBadge>
				</div>
			</div>
		</div>
	);
}
