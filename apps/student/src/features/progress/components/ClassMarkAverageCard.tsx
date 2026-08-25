import { TrendingDown, TrendingUp } from 'lucide-react';

import { Card, cn, Separator } from '@repo/ui';
import { formatShortDate } from '@repo/utils';

import type { StudentMarkSummary } from '../api/marks.queries';
import {
	MARK_TONE_CLASS,
	markBarHeightPct,
	markShortLabel,
	markTone,
	scaleNameLabel,
} from '../lib/mark-format';
import { useAppT } from '@/locales';

interface ClassMarkAverageCardProps {
	summary: StudentMarkSummary;
}

/**
 * The Progress screen's header card: the class mark average, its movement
 * against the earlier block of marks, and a bar chart of the last ten marks.
 *
 * The average is a percentage for every scale type, because a group may have
 * graded on more than one scale over a term — the note under it says so. Each
 * bar is still labelled with the mark *as entered* (`8`, `B`, `88`); only the
 * bar height and colour use the normalized percentage. Where the group switched
 * scale mid-term, a dashed divider marks the boundary and the note below names
 * the new scale and the date it started.
 */
export function ClassMarkAverageCard({ summary }: ClassMarkAverageCardProps) {
	const t = useAppT('progress');
	const { averagePct, markedCount, deltaPct, recent, scales, scaleChange } = summary;

	const rising = (deltaPct ?? 0) >= 0;
	const TrendIcon = rising ? TrendingUp : TrendingDown;

	// One scale → name it. Several → explain why the average is a percentage.
	const note =
		scales.length === 0
			? t('noMarksNote')
			: scales.length === 1
				? t('singleScaleNote', { scale: scaleNameLabel(scales[0]!, t) })
				: t('multiScaleNote', { count: scales.length });

	return (
		<Card className="gap-0 rounded-[17px] py-0">
			<div className="p-4">
				<div className="flex items-start justify-between gap-2.5">
					<div className="min-w-0">
						<p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
							{t('markAverageTitle')}
						</p>
						<div className="mt-2 flex items-baseline gap-2">
							<span className="text-3xl font-extrabold leading-none tracking-tight tabular-nums text-foreground">
								{averagePct === null ? '—' : `${Math.round(averagePct)}%`}
							</span>
							<span className="text-[13px] font-semibold text-muted-foreground">
								{t('acrossMarkedClasses', { count: markedCount })}
							</span>
						</div>
					</div>
					{deltaPct !== null && deltaPct !== 0 && (
						<span
							className={cn(
								'inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold',
								rising
									? 'bg-tone-green-bg text-tone-green-fg'
									: 'bg-tone-red-bg text-tone-red-fg',
							)}
						>
							<TrendIcon className="size-3.5" />
							{t('deltaVsEarlier', {
								delta: `${rising ? '+' : ''}${Math.round(deltaPct)}`,
							})}
						</span>
					)}
				</div>
				<p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
					{note}
				</p>

				{recent.length > 0 && (
					<>
						<Separator className="mb-3 mt-4" />
						<p className="mb-3 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
							{t('recentMarks')}
						</p>
						<div className="flex h-30 items-end gap-1.5">
							{recent.map((bar, i) => {
								const previous = recent[i - 1];
								// The scale switch shows as a dashed break, not a gap:
								// the bars either side are still the same student's
								// marks, only measured differently.
								const breaks =
									previous !== undefined &&
									previous.scale.configId !== bar.scale.configId;
								const tone = MARK_TONE_CLASS[markTone(bar.normalizedPct)];

								return (
									<div
										key={bar.sessionId}
										title={`${formatShortDate(bar.sessionDate)} · ${bar.normalizedPct}%`}
										className={cn(
											'flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5',
											breaks &&
												'border-l-[1.5px] border-dashed border-border pl-2',
										)}
									>
										<span
											className={cn(
												'max-w-full truncate text-[10.5px] font-bold tabular-nums',
												tone.fg,
											)}
										>
											{markShortLabel(
												bar.scale,
												bar.rawScore,
												bar.letter,
											)}
										</span>
										{/* Height is data-driven, so it stays an inline style. */}
										<div
											className={cn(
												'w-full rounded-t-[7px] rounded-b-[3px]',
												tone.bg,
											)}
											style={{
												height: `${markBarHeightPct(bar.normalizedPct)}%`,
											}}
										/>
										<span className="max-w-full truncate text-[9px] text-muted-foreground">
											{formatShortDate(bar.sessionDate)}
										</span>
									</div>
								);
							})}
						</div>
					</>
				)}

				{scaleChange && (
					<div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-muted px-3 py-2.5">
						<span className="mt-2 w-3.5 shrink-0 border-t-[1.5px] border-dashed border-muted-foreground" />
						<p className="text-[11.5px] leading-relaxed text-foreground/70">
							{t('scaleChangeNote', {
								scale: scaleNameLabel(scaleChange.scale, t),
								date: formatShortDate(scaleChange.at),
							})}
						</p>
					</div>
				)}
			</div>
		</Card>
	);
}
