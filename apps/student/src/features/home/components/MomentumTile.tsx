import type { ReactNode } from 'react';

import { Card, ProgressBar, cn, type StatusTone } from '@repo/ui';

/**
 * The tones the momentum row actually uses. Deliberately narrower than
 * `StatusTone`: this row is two fixed tiles, and listing eleven palettes for
 * two callers would ship class strings nothing renders.
 */
type MomentumTone = 'amber' | 'green';

/**
 * Per-tone class strings, in the same shape (and for the same reason) as the
 * leaderboard's `place.ts` — Tailwind only generates classes it can see written
 * out, so each set is literal here rather than composed from the tone name.
 *
 * Each tone reaches exactly three small things: the icon chip, the bar, and the
 * encouragement pill. The tile's surface, its label and its figure stay neutral
 * — on Home the coloured field belongs to the hero alone, and a tile that wore
 * its tone edge to edge would compete with the one card a student needs to read
 * first.
 */
const MOMENTUM_TONE: Record<
	MomentumTone,
	{ chip: string; pill: string; bar: StatusTone }
> = {
	amber: {
		chip: 'bg-tone-amber-bg text-tone-amber-fg',
		pill: 'bg-tone-amber-bg text-tone-amber-fg',
		bar: 'amber',
	},
	green: {
		chip: 'bg-tone-green-bg text-tone-green-fg',
		pill: 'bg-tone-green-bg text-tone-green-fg',
		bar: 'green',
	},
};

interface MomentumTileProps {
	label: ReactNode;
	value: ReactNode;
	/** Small caption beside the value — "sessions in a row", and nothing for a percentage. */
	unit?: ReactNode;
	icon: ReactNode;
	tone: MomentumTone;
	/** 0–100. Omitted when the figure has no denominator to fill (a streak has none). */
	progress?: number;
	/** The one-word encouragement, already translated — see `lib/cheer.ts`. */
	cheer: ReactNode;
}

/**
 * One tile of Home's momentum row — the streak and the attendance rate.
 *
 * It is `@repo/ui`'s `StatCard` in all but one respect, and deliberately so: the
 * same panel, the same soft tone chip, the same neutral figure, so the two tiles
 * sit in the student app exactly as the KPI tiles sit in the staff consoles. The
 * one difference is the ending — an encouragement instead of a trend delta,
 * because the audience here is 8–18 and "7" alone does not tell a child whether
 * seven is good.
 *
 * `StatCard` itself is not reused because its delta slot is typed for a trend
 * and its layout puts the icon opposite the label rather than beside it; the
 * shared component stays right for the dashboards it was built for.
 *
 * The cheer is pinned to the bottom so the two tiles line up even though only
 * one of them has a bar to draw.
 */
export function MomentumTile({
	label,
	value,
	unit,
	icon,
	tone,
	progress,
	cheer,
}: MomentumTileProps) {
	const palette = MOMENTUM_TONE[tone];

	return (
		<Card className="h-full gap-0 py-0">
			<div className="flex h-full flex-col gap-2.5 p-4">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							'flex size-9 shrink-0 items-center justify-center rounded-lg [&>svg]:size-4.5',
							palette.chip,
						)}
					>
						{icon}
					</span>
					<span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						{label}
					</span>
				</div>

				<div className="flex items-baseline gap-1.5">
					<span className="text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground">
						{value}
					</span>
					{unit && (
						<span className="min-w-0 truncate text-xs text-muted-foreground">
							{unit}
						</span>
					)}
				</div>

				{progress !== undefined && (
					<ProgressBar value={progress} tone={palette.bar} />
				)}

				<span
					className={cn(
						'mt-auto w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold',
						palette.pill,
					)}
				>
					{cheer}
				</span>
			</div>
		</Card>
	);
}
