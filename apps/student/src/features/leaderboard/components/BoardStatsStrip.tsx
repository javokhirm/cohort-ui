import { Gauge, Medal, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { formatPercent } from '@repo/utils';

import type { StudentLeaderboard } from '../api/leaderboard.queries';
import { useAppT } from '@/locales';

interface BoardStatsStripProps {
	board: StudentLeaderboard;
}

/**
 * What the board is measuring, in three numbers: how many students are on the
 * roster, how many of them cleared `minMarks`, and what the ranked students
 * average.
 *
 * It exists because every other number on the screen is relative — a placing
 * only means something once "of how many" is on screen too, and `rows` is
 * capped server-side so the list length cannot answer that.
 */
export function BoardStatsStrip({ board }: BoardStatsStripProps) {
	const t = useAppT('leaderboard');

	return (
		// A 1px gap over `bg-border` draws the dividers without a border per cell.
		<div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-xs">
			<Stat icon={Users} label={t('inGroup')} value={board.cohortSize} />
			<Stat icon={Medal} label={t('rankedLabel')} value={board.rankedCount} />
			<Stat
				icon={Gauge}
				label={t('groupAverage')}
				value={
					board.groupAveragePct === null
						? '—'
						: formatPercent(board.groupAveragePct)
				}
			/>
		</div>
	);
}

function Stat({
	icon: Icon,
	label,
	value,
}: {
	icon: LucideIcon;
	label: string;
	value: string | number;
}) {
	return (
		<div className="flex flex-col gap-0.5 bg-card px-2.5 py-2.5 sm:px-3">
			<span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
				<Icon aria-hidden="true" className="size-3 shrink-0" />
				<span className="truncate">{label}</span>
			</span>
			<span className="text-[15px] font-extrabold tabular-nums text-foreground">
				{value}
			</span>
		</div>
	);
}
