import { ChevronRight, Sparkles, Trophy } from 'lucide-react';

import { Card, cn } from '@repo/ui';

import type { StudentHomeLeaderboard } from '@/features/home/api/home.queries';
import { isPodiumRank, placeStyle } from '../lib/place';
import { topPercentile } from '../lib/standing';
import { FOCUS_RING, clickableCardProps } from '@/lib/clickable-card';
import { useAppT } from '@/locales';

interface HomeLeaderboardCardProps {
	standing: StudentHomeLeaderboard;
	/** Opens the full board for this group. */
	onOpen: () => void;
}

/**
 * Home's entry point to the leaderboard — the student's placing in their primary
 * group this month.
 *
 * A podium placing wears its medal here too, in the same soft tone chip the
 * board uses, so the colour a student sees on Home is the colour they find
 * themselves in on the board; anything below third keeps the neutral trophy on
 * the brand's indigo. That chip is the whole of the colour — Home gives its one
 * saturated field to the hero, so a first place does not out-shout the class a
 * student still has to turn up to.
 *
 * Placement is never carried by colour alone: the rank is stamped on the medal
 * and spelled out beside it.
 *
 * It is the app's ordinary `Card`, like every other panel in Home's right-hand
 * column. This is the one component outside `features/home` that renders inside
 * that column, and it is Home-only — nothing on the leaderboard screen itself
 * uses it.
 *
 * Reads from the `leaderboard` block on `GET /student/home`, so it costs no extra
 * request. The server returns `null` whenever there is no rank worth reporting,
 * and Home skips the card entirely in that case; nothing here has to decide
 * whether the standing is meaningful.
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
			className={cn(
				'cursor-pointer gap-0 py-0 transition-colors hover:border-primary',
				FOCUS_RING,
			)}
		>
			<div className="flex items-center gap-3 p-4">
				<span
					className={cn(
						'relative flex size-12 shrink-0 items-center justify-center rounded-xl',
						medal ? medal.chip : 'bg-tone-indigo-bg text-tone-indigo-fg',
					)}
				>
					<Icon className="size-6" />
					<span className="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[11px] font-semibold tabular-nums text-foreground">
						{standing.rank}
					</span>
				</span>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
							{t('homeCardTitle')}
						</span>
						{topPct !== null && (
							<span className="inline-flex items-center gap-1 rounded-full bg-tone-indigo-bg px-1.5 py-px text-[10px] font-semibold tabular-nums text-tone-indigo-fg">
								<Sparkles aria-hidden="true" className="size-2.5" />
								{t('topPercent', { pct: topPct })}
							</span>
						)}
					</div>
					<p className="text-lg font-bold leading-tight tracking-tight tabular-nums text-foreground">
						{t('rankOfTotal', {
							rank: standing.rank,
							total: standing.rankedCount,
						})}
						{standing.tied && (
							<span className="ml-1.5 text-xs font-medium text-muted-foreground">
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
