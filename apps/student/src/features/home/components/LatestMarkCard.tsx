import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, cn } from '@repo/ui';
import { formatShortDate } from '@repo/utils';

import type { StudentLatestMark } from '../api/home.queries';
import {
	MARK_TONE_CLASS,
	markTone,
	markValueLabel,
	scaleUnitLabel,
} from '@/features/progress/lib/mark-format';
import { FOCUS_RING, clickableCardProps } from '@/lib/clickable-card';
import { useAppT } from '@/locales';

interface LatestMarkCardProps {
	latest: StudentLatestMark;
	/** Opens the Progress screen, filtered to this mark's group. */
	onOpen: () => void;
}

/**
 * Home's "Latest mark" card: the newest daily mark in its own scale, how it
 * moved against the previous mark in the same group, and the class it came from.
 *
 * The mark itself is the anchor — a tone-coloured tile keyed off `normalizedPct`
 * through the same `markTone` the Progress chips and chart use, so an `8/10`
 * here is the exact colour that `8/10` wears on Progress. That shared pairing is
 * the whole reason this card is allowed a tinted block at all; it is the tile
 * only, and the panel around it stays neutral. Colour never carries the mark
 * alone: the value and its unit are printed inside the tile.
 *
 * The delta is same-group only (the API enforces this), so the card never
 * compares an `8/10` in one course against a `B` in another.
 *
 * The whole card opens Progress, so it carries a button's role and keyboard
 * behaviour — see `lib/clickable-card.ts`.
 */
export function LatestMarkCard({ latest, onOpen }: LatestMarkCardProps) {
	const t = useAppT('home');
	const tProgress = useAppT('progress');
	const { mark, deltaPct } = latest;

	const tone = MARK_TONE_CLASS[markTone(mark.normalizedPct)];
	const rising = (deltaPct ?? 0) >= 0;
	const TrendIcon = rising ? TrendingUp : TrendingDown;

	return (
		<Card
			{...clickableCardProps(onOpen)}
			className={cn(
				'cursor-pointer gap-0 py-0 transition-colors hover:border-primary',
				FOCUS_RING,
			)}
		>
			<div className="flex flex-col gap-3 p-4">
				<div className="flex items-center justify-between gap-2">
					<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						{t('latestMark')}
					</span>
					<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
				</div>

				<div className="flex items-center gap-3">
					<div
						className={cn(
							'flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl',
							tone.bg,
							tone.fg,
						)}
					>
						<span className="text-xl font-bold leading-none tracking-tight tabular-nums">
							{markValueLabel(mark.scale, mark.rawScore, mark.letter)}
						</span>
						<span className="max-w-full truncate px-1 text-[10px] font-semibold">
							{scaleUnitLabel(mark.scale, tProgress)}
						</span>
					</div>

					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-bold text-foreground">
							{latest.topic ?? t('dailyClassMark')}
						</p>
						<p className="mt-0.5 truncate text-xs text-muted-foreground">
							{latest.groupName} · {formatShortDate(latest.sessionDate)}
						</p>
						<span
							className={cn(
								'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
								deltaPct === null
									? 'bg-muted text-muted-foreground'
									: rising
										? 'bg-tone-green-bg text-tone-green-fg'
										: 'bg-tone-red-bg text-tone-red-fg',
							)}
						>
							{deltaPct === null ? (
								t('firstMark')
							) : (
								<>
									<TrendIcon className="size-3" />
									{t('deltaVsLast', {
										delta: `${rising ? '+' : ''}${Math.round(deltaPct)}`,
									})}
								</>
							)}
						</span>
					</div>
				</div>
			</div>
		</Card>
	);
}
