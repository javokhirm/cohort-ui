import { Trophy } from 'lucide-react';

import { Avatar, AvatarFallback, cn } from '@repo/ui';
import { formatPercent } from '@repo/utils';

import type { StudentLeaderboardRow } from '../api/leaderboard.queries';
import { placeStyle } from '../lib/place';
import { rowInitials, rowLabel } from '../lib/row-label';
import { useAppT } from '@/locales';

interface LeaderboardPodiumProps {
	/** The first three ranked rows, best first. Fewer is fine. */
	rows: StudentLeaderboardRow[];
}

/**
 * Which column each row stands in, keyed by how many rows there are: the winner
 * takes the middle whenever there is a middle to take, second stands to its
 * left, third to its right. Values are indexes into `rows`.
 */
const SLOT_ORDER: Record<number, number[]> = {
	1: [0],
	2: [1, 0],
	3: [1, 0, 2],
};

/** Column count, plus a cap so one or two placings don't stretch across the card. */
const GRID: Record<number, string> = {
	1: 'grid-cols-1 max-w-32',
	2: 'grid-cols-2 max-w-64',
	3: 'grid-cols-3',
};

/** Staggered entrance, left to right — decoration only, dropped under reduced motion. */
const SLOT_DELAY = ['delay-150', 'delay-0', 'delay-300'];

/**
 * The top three as an actual stepped podium: second, first, third, each on a
 * block whose height matches its place.
 *
 * It fits 375px because a column carries only an avatar, a name and a score —
 * everything else (mark counts, the full ordering) lives in the list below. The
 * medal colour, the icon and the numeral all say the same thing, so the placing
 * survives greyscale and colour blindness.
 *
 * Colour follows `rank`, not the column: two students tied at rank 1 both wear
 * gold, and the step they stand on is the only thing the layout decides.
 */
export function LeaderboardPodium({ rows }: LeaderboardPodiumProps) {
	const t = useAppT('leaderboard');
	const order = SLOT_ORDER[rows.length] ?? rows.map((_, index) => index);

	return (
		<div className="relative overflow-hidden rounded-2xl border border-border bg-card px-3 pt-3 shadow-xs">
			{/* Warm glow behind the winner — pure decoration. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute left-1/2 top-0 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tone-amber-bg blur-3xl"
			/>

			<div className="relative mb-1 flex items-center gap-1.5 px-1">
				<Trophy className="size-3.5 text-tone-amber-fg" />
				<h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
					{t('podiumTitle')}
				</h2>
			</div>

			<div
				className={cn(
					'relative mx-auto grid items-end gap-2 sm:gap-3',
					GRID[rows.length] ?? 'grid-cols-3',
				)}
			>
				{order.map((index, slot) => {
					const row = rows[index]!;
					const style = placeStyle(row.rank ?? index + 1);
					const label = rowLabel(row, t, index + 1);
					const { Icon } = style;

					return (
						<div
							key={`${row.rank}-${index}`}
							className={cn(
								'flex min-w-0 animate-in flex-col items-center fade-in slide-in-from-bottom-4 fill-mode-backwards duration-500 motion-reduce:animate-none',
								SLOT_DELAY[slot] ?? 'delay-0',
							)}
						>
							<div className="relative pt-3">
								{/* The winner alone is crowned, above the avatar. */}
								{row.rank === 1 && (
									<Icon
										aria-hidden="true"
										className={cn(
											'absolute left-1/2 top-0 size-4 -translate-x-1/2 -rotate-12',
											style.fg,
										)}
									/>
								)}

								<Avatar
									className={cn(
										'size-12 ring-2 ring-offset-2 ring-offset-card sm:size-14',
										row.isMe ? 'ring-primary' : style.ring,
									)}
								>
									<AvatarFallback
										className={cn(
											'text-[11px] font-bold',
											row.isMe &&
												'bg-primary text-primary-foreground',
										)}
									>
										{rowInitials(row, label)}
									</AvatarFallback>
								</Avatar>

								{/* Medal: the place's own shape, sat on the avatar's edge. */}
								<span
									className={cn(
										'absolute -bottom-1.5 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-card',
										style.chip,
									)}
								>
									<Icon aria-hidden="true" className="size-3.5" />
								</span>
							</div>

							<span
								className={cn(
									'mt-3 w-full truncate text-center text-[12px] sm:text-[13px]',
									row.isMe
										? 'font-extrabold text-foreground'
										: 'font-semibold text-foreground/85',
								)}
							>
								{label}
							</span>

							<span className="text-[13px] font-extrabold tabular-nums text-foreground sm:text-[15px]">
								{row.averagePct === null
									? '—'
									: formatPercent(row.averagePct)}
							</span>

							<span className="w-full truncate text-center text-[10px] tabular-nums text-muted-foreground">
								{t('markedCount', { count: row.markedCount })}
							</span>

							{/* The block itself: tinted at the top, carrying the rank. */}
							<div
								className={cn(
									'mt-2 flex w-full justify-center rounded-t-xl border border-b-0 bg-linear-to-b to-card pt-1.5',
									style.plinth,
									style.step,
									row.isMe && 'border-primary/50',
								)}
								title={row.tied ? t('tiedLabel') : undefined}
							>
								<span
									className={cn(
										'text-lg font-black tabular-nums sm:text-xl',
										style.fg,
									)}
								>
									{row.tied && (
										<>
											<span aria-hidden="true">=</span>
											<span className="sr-only">
												{t('tiedLabel')}{' '}
											</span>
										</>
									)}
									{row.rank}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
