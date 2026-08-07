import { Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, cn } from '@repo/ui';
import { formatPercent } from '@repo/utils';

import type { StudentLeaderboard } from '../api/leaderboard.queries';
import { isPodiumRank, placeStyle } from '../lib/place';
import { useAppT } from '@/locales';

interface MyRankCardProps {
	board: StudentLeaderboard;
}

/** Most segments the meter draws — beyond this the blocks get too thin to read. */
const MAX_SEGMENTS = 12;

/**
 * The student's own standing, always rendered — the one thing this screen must
 * answer even when the board itself is empty.
 *
 * It is the only filled, brand-coloured panel on the screen: every peer row and
 * the podium sit on `card`, so "where am I" is findable before a single word is
 * read, whether it is above the board or pinned below it.
 *
 * An unranked student is never shown as last: they get a meter counting toward
 * `minMarks` instead of a placing, because too few marks is an absence of
 * evidence, not a bottom finish.
 *
 * Everything beyond the raw fields — the percentile, how many students are
 * below, the gap to the group — is arithmetic on what the endpoint sent. No
 * number here is invented.
 */
export function MyRankCard({ board }: MyRankCardProps) {
	const t = useAppT('leaderboard');
	const { me, rankedCount, groupAveragePct } = board;

	if (me.rank === null) return <UnrankedCard board={board} />;

	const style = placeStyle(me.rank);
	const onPodium = isPodiumRank(me.rank);
	// Rank 1 of 10 is the top 10%; the floor keeps a winner out of "top 0%".
	const topPct =
		rankedCount > 0 ? Math.max(1, Math.round((me.rank / rankedCount) * 100)) : null;
	const behindMe = Math.max(rankedCount - me.rank, 0);
	// Filled from the bottom up: last place still lights one segment, first fills them all.
	const segments = Math.min(rankedCount, MAX_SEGMENTS);
	const filled =
		rankedCount > 0
			? Math.max(
					1,
					Math.round(((rankedCount - me.rank + 1) / rankedCount) * segments),
				)
			: 0;
	// A tenth of a point is below what `formatPercent` prints, so it reads as level.
	const delta =
		me.averagePct !== null && groupAveragePct !== null
			? me.averagePct - groupAveragePct
			: null;

	return (
		<HeroCard>
			<div className="relative flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
				<div
					className={cn(
						'flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-inset ring-primary-foreground/25 sm:size-18',
						onPodium && 'bg-primary-foreground/25',
					)}
				>
					{onPodium ? (
						<style.Icon aria-hidden="true" className="size-3.5 opacity-90" />
					) : (
						<span
							aria-hidden="true"
							className="text-[11px] font-bold opacity-70"
						>
							#
						</span>
					)}
					<span className="text-2xl font-black leading-none tabular-nums sm:text-3xl">
						{me.rank}
					</span>
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-[11px] font-bold uppercase tracking-wide opacity-85">
							{t('yourPlace')}
						</span>
						{topPct !== null && (
							<span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold tabular-nums">
								<Sparkles aria-hidden="true" className="size-2.5" />
								{t('topPercent', { pct: topPct })}
							</span>
						)}
					</div>

					<p className="text-lg font-extrabold tabular-nums tracking-tight sm:text-xl">
						{t('rankOfTotal', { rank: me.rank, total: rankedCount })}
						{me.tied && (
							<span className="ml-1.5 text-xs font-semibold opacity-85">
								{t('tiedLabel')}
							</span>
						)}
					</p>

					<p className="text-xs tabular-nums opacity-90">
						{me.averagePct === null ? '—' : formatPercent(me.averagePct)} ·{' '}
						{t('markedCount', { count: me.markedCount })}
					</p>
				</div>
			</div>

			<div className="relative px-4 pb-4 sm:px-5">
				<SegmentMeter total={segments} filled={filled} />
				<p className="mt-1.5 text-[11px] font-medium tabular-nums opacity-90">
					{me.rank === 1
						? t('leadingBoard')
						: behindMe > 0
							? t('aheadOf', { count: behindMe })
							: t('keepGoing')}
				</p>
			</div>

			{groupAveragePct !== null && (
				<div className="relative flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-primary-foreground/15 bg-primary-foreground/10 px-4 py-2.5 sm:px-5">
					<span className="text-[11px] font-semibold opacity-90">
						{t('groupAverage')}
					</span>
					<span className="flex items-center gap-2">
						<span className="text-[13px] font-bold tabular-nums">
							{formatPercent(groupAveragePct)}
						</span>
						{delta !== null && <DeltaChip delta={delta} />}
					</span>
				</div>
			)}
		</HeroCard>
	);
}

/**
 * The same panel for a student the window has not ranked yet. It answers a
 * different question — how far off am I — so the meter counts marks toward
 * `minMarks` rather than a position.
 */
function UnrankedCard({ board }: MyRankCardProps) {
	const t = useAppT('leaderboard');
	const { me, minMarks } = board;
	const remaining = Math.max(minMarks - me.markedCount, 1);
	const segments = Math.min(Math.max(minMarks, 1), MAX_SEGMENTS);
	const filled = Math.min(
		Math.round((me.markedCount / Math.max(minMarks, 1)) * segments),
		segments,
	);

	return (
		<HeroCard>
			<div className="relative flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
				<span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-inset ring-primary-foreground/25 sm:size-18">
					<Target aria-hidden="true" className="size-7" />
				</span>

				<div className="min-w-0 flex-1">
					<span className="text-[11px] font-bold uppercase tracking-wide opacity-85">
						{t('yourPlace')}
					</span>
					<p className="text-lg font-extrabold tracking-tight sm:text-xl">
						{t('unrankedTitle')}
					</p>
					<p className="text-xs opacity-90">
						{t('unrankedHint', { count: remaining })}
					</p>
				</div>
			</div>

			<div className="relative px-4 pb-4 sm:px-5">
				<SegmentMeter total={segments} filled={filled} />
				<p className="mt-1.5 text-[11px] font-medium tabular-nums opacity-90">
					{t('marksProgress', { done: me.markedCount, total: minMarks })}
				</p>
			</div>
		</HeroCard>
	);
}

/** The filled brand panel both states share, glow and all. */
function HeroCard({ children }: { children: React.ReactNode }) {
	return (
		<Card className="relative gap-0 overflow-hidden border-transparent bg-primary py-0 text-primary-foreground shadow-lg">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-primary-foreground/10 blur-2xl"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-14 -left-8 size-32 rounded-full bg-primary-foreground/10 blur-2xl"
			/>
			{children}
		</Card>
	);
}

/**
 * A blocky meter rather than a bar — it reads as "N of M steps" at a glance,
 * which is what both states are actually saying, and it needs no width
 * calculation to render.
 */
function SegmentMeter({ total, filled }: { total: number; filled: number }) {
	return (
		<div aria-hidden="true" className="flex gap-1">
			{Array.from({ length: total }, (_, index) => (
				<span
					key={index}
					className={cn(
						'h-2 flex-1 rounded-full transition-colors',
						index < filled
							? 'bg-primary-foreground'
							: 'bg-primary-foreground/25',
					)}
				/>
			))}
		</div>
	);
}

/** How far my average sits from the group's, in percentage points. */
function DeltaChip({ delta }: { delta: number }) {
	const t = useAppT('leaderboard');
	// Below `formatPercent`'s one decimal the gap would render as "0.0%".
	if (Math.abs(delta) < 0.05) {
		return (
			<span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10.5px] font-bold">
				{t('levelWithGroup')}
			</span>
		);
	}

	const Icon = delta > 0 ? TrendingUp : TrendingDown;
	const value = formatPercent(Math.abs(delta));

	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10.5px] font-bold tabular-nums">
			<Icon aria-hidden="true" className="size-3" />
			{delta > 0 ? t('aboveGroup', { value }) : t('belowGroup', { value })}
		</span>
	);
}
