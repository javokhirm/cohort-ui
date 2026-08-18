import { Avatar, AvatarFallback, cn, ProgressBar } from '@repo/ui';
import { formatPercent } from '@repo/utils';

import type { StudentLeaderboardRow } from '../api/leaderboard.queries';
import { isPodiumRank, placeStyle } from '../lib/place';
import { rowInitials, rowLabel } from '../lib/row-label';
import { useAppT } from '@/locales';

interface LeaderboardRowProps {
	row: StudentLeaderboardRow;
	/** 1-based position in the board — what an anonymous row is numbered by. */
	position: number;
}

/**
 * One placing below the podium.
 *
 * The score is drawn as well as printed: `averagePct` is already a 0–100 mean,
 * so the bar is the number itself, not a ratio to whoever is on top — a row
 * means the same thing whether it is read in the list or pinned on its own.
 *
 * The viewer's own row is outlined, tinted and badged "You", so it is findable
 * without reading every name. A tied rank is prefixed with `=` and carries the
 * reason as accessible text, so the equality is not conveyed by a bare symbol.
 */
export function LeaderboardRow({ row, position }: LeaderboardRowProps) {
	const t = useAppT('leaderboard');
	const label = rowLabel(row, t, position);
	// Only reached when a podium student is pinned below — the list itself starts at 4.
	const medal = isPodiumRank(row.rank) ? placeStyle(row.rank!) : null;

	return (
		<div
			className={cn(
				'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
				row.isMe
					? 'border-primary bg-tone-indigo-bg ring-1 ring-primary/25'
					: 'border-border bg-card',
			)}
		>
			{/* `min-w-7` rather than a fixed square: rows run to rank 10, and a
			    tied one is prefixed, so "=10" has to fit without clipping. */}
			<span
				className={cn(
					'flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg px-1 text-[12px] font-black tabular-nums',
					row.isMe && 'bg-primary text-primary-foreground',
					!row.isMe && medal && medal.chip,
					!row.isMe && !medal && 'bg-muted text-muted-foreground',
				)}
				title={row.tied ? t('tiedLabel') : undefined}
			>
				{row.tied && (
					<>
						<span aria-hidden="true">=</span>
						<span className="sr-only">{t('tiedLabel')} </span>
					</>
				)}
				{row.rank}
			</span>

			<Avatar className="size-8 shrink-0">
				<AvatarFallback
					className={cn(
						'text-[11px] font-semibold',
						row.isMe && 'bg-primary text-primary-foreground',
					)}
				>
					{rowInitials(row, label)}
				</AvatarFallback>
			</Avatar>

			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-center gap-1.5">
					<span
						className={cn(
							'min-w-0 truncate text-[13.5px]',
							row.isMe
								? 'font-extrabold text-foreground'
								: 'font-medium text-foreground/85',
						)}
					>
						{label}
					</span>
					{row.isMe && (
						<span className="shrink-0 rounded-full bg-primary px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
							{t('you')}
						</span>
					)}
				</div>
				{row.averagePct !== null && (
					<ProgressBar
						value={row.averagePct}
						tone={row.isMe ? 'indigo' : 'slate'}
						className={cn(row.isMe && 'bg-primary/15')}
					/>
				)}
			</div>

			<div className="flex shrink-0 flex-col items-end">
				<span
					className={cn(
						'tabular-nums text-foreground',
						row.isMe
							? 'text-[14.5px] font-extrabold'
							: 'text-[13.5px] font-bold',
					)}
				>
					{row.averagePct === null ? '—' : formatPercent(row.averagePct)}
				</span>
				<span className="text-[10.5px] tabular-nums text-muted-foreground">
					{t('markedCount', { count: row.markedCount })}
				</span>
			</div>
		</div>
	);
}
