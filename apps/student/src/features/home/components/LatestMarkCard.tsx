import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, cn } from '@repo/ui';
import { formatShortDate } from '@repo/utils';

import type { StudentLatestMark } from '../api/home.queries';
import { markValueLabel, scaleUnitLabel } from '@/features/progress/lib/mark-format';
import { useAppT } from '@/locales';

interface LatestMarkCardProps {
	latest: StudentLatestMark;
	/** Opens the Progress screen, filtered to this mark's group. */
	onOpen: () => void;
}

/**
 * Home's "Latest mark" card: the newest daily mark in its own scale, how it moved
 * against the previous mark in the same group, and the class it came from.
 *
 * The delta is same-group only (the API enforces this), so the card never
 * compares an `8/10` in one course against a `B` in another.
 */
export function LatestMarkCard({ latest, onOpen }: LatestMarkCardProps) {
	const t = useAppT('home');
	const tProgress = useAppT('progress');
	const { mark, deltaPct } = latest;

	const rising = (deltaPct ?? 0) >= 0;
	const TrendIcon = rising ? TrendingUp : TrendingDown;

	return (
		<Card
			onClick={onOpen}
			className="cursor-pointer gap-0 py-0 transition-colors hover:border-primary"
		>
			<div className="flex flex-col gap-1 p-4">
				<div className="flex items-center justify-between gap-2">
					<span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
						{t('latestMark')}
					</span>
					<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
				</div>
				<div className="flex items-baseline gap-1.5">
					<span className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
						{markValueLabel(mark.scale, mark.rawScore, mark.letter)}
					</span>
					<span className="text-xs font-medium text-muted-foreground">
						{scaleUnitLabel(mark.scale, tProgress)}
					</span>
					<span
						className={cn(
							'ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold',
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
				<span className="truncate text-[13px] font-semibold text-foreground">
					{latest.topic ?? t('dailyClassMark')}
				</span>
				<span className="truncate text-xs text-muted-foreground">
					{latest.groupName} · {formatShortDate(latest.sessionDate)}
				</span>
			</div>
		</Card>
	);
}
