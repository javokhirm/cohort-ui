import { ChevronRight, Sparkles, Trophy } from 'lucide-react';

import { Card, cn } from '@repo/ui';

import type { StudentHomeLeaderboard } from '@/features/home/api/home.queries';
import { isPodiumRank, placeStyle } from '../lib/place';
import { topPercentile } from '../lib/standing';
import { clickableCardProps } from '@/lib/clickable-card';
import { useAppT } from '@/locales';

interface HomeLeaderboardCardProps {
	standing: StudentHomeLeaderboard;
	/** Opens the full board for this group. */
	onOpen: () => void;
}

/**
 * Home's entry point to the leaderboard — the student's placing in their
 * primary group this month.
 *
 * A podium placing wears its medal here too, so the colour a student sees on
 * Home is the colour they find themselves in on the board; anything below third
 * keeps the neutral trophy.
 *
 * Reads from the `leaderboard` block on `GET /student/home`, so it costs no
 * extra request. The server returns `null` whenever there is no rank worth
 * reporting, and Home skips the card entirely in that case; nothing here has to
 * decide whether the standing is meaningful.
 *
 * The whole card is the target, so it carries a button's role and keyboard
 * behaviour rather than a bare `onClick` — see `lib/clickable-card.ts`.
 */
export function HomeLeaderboardCard({ standing, onOpen }: HomeLeaderboardCardProps) {
	const t = useAppT('leaderboard');
	const medal = isPodiumRank(standing.rank) ? placeStyle(standing.rank) : null;
	const Icon = medal?.Icon ?? Trophy;
	// Same rule the board applies, from one place — Home must not congratulate a
	// student the board itself would not.
	const topPct = topPercentile(standing.rank, standing.rankedCount);

	return (
		<Card
			{...clickableCardProps(onOpen)}
			className="cursor-pointer gap-0 overflow-hidden py-0 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			<div className="flex items-center gap-3 p-4">
				<span
					className={cn(
						'relative flex size-10 shrink-0 items-center justify-center rounded-xl',
						medal ? medal.chip : 'bg-tone-indigo-bg text-tone-indigo-fg',
					)}
				>
					<Icon className="size-5" />
					<span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-card text-[10px] font-black tabular-nums text-foreground">
						{standing.rank}
					</span>
				</span>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
							{t('homeCardTitle')}
						</span>
						{topPct !== null && (
							<span className="inline-flex items-center gap-1 rounded-full bg-tone-indigo-bg px-1.5 py-px text-[10px] font-bold tabular-nums text-tone-indigo-fg">
								<Sparkles aria-hidden="true" className="size-2.5" />
								{t('topPercent', { pct: topPct })}
							</span>
						)}
					</div>
					<p className="text-lg font-extrabold tabular-nums tracking-tight text-foreground">
						{t('rankOfTotal', {
							rank: standing.rank,
							total: standing.rankedCount,
						})}
						{standing.tied && (
							<span className="ml-1.5 text-xs font-semibold text-muted-foreground">
								{t('tiedLabel')}
							</span>
						)}
					</p>
					<p className="truncate text-xs text-muted-foreground">
						{standing.groupName}
					</p>
				</div>

				<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
			</div>
		</Card>
	);
}
