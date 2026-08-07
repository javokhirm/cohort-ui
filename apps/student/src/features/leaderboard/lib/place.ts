import { Award, Crown, Medal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { StatusTone } from '@repo/ui';

/**
 * How one podium placing looks — gold, silver, bronze.
 *
 * Every class here resolves to a design-system tone token; the app introduces
 * no colours of its own (apps/student/CLAUDE.md), so the medals theme with the
 * rest of the app in both light and dark.
 *
 * **Placement is never carried by colour alone.** Each place also has its own
 * icon and always states its rank as a number, so first from third is readable
 * without seeing gold as different from bronze.
 */
export interface PlaceStyle {
	tone: StatusTone;
	/** Crown / medal / award — the shape that distinguishes the place. */
	Icon: LucideIcon;
	/** Medal chip: the tone's soft surface with its matching foreground. */
	chip: string;
	/** The tone's foreground on its own, for text and icons. */
	fg: string;
	/** Ring drawn around the placing's avatar. */
	ring: string;
	/** The block the placing stands on, tinted from the top down. */
	plinth: string;
	/** How tall that block stands — first is tallest. */
	step: string;
}

const PLACE_STYLES: Record<1 | 2 | 3, PlaceStyle> = {
	1: {
		tone: 'amber',
		Icon: Crown,
		chip: 'bg-tone-amber-bg text-tone-amber-fg',
		fg: 'text-tone-amber-fg',
		ring: 'ring-tone-amber-fg',
		plinth: 'from-tone-amber-bg border-tone-amber-fg/40',
		step: 'h-16 sm:h-20',
	},
	2: {
		tone: 'slate',
		Icon: Medal,
		chip: 'bg-tone-slate-bg text-tone-slate-fg',
		fg: 'text-tone-slate-fg',
		ring: 'ring-tone-slate-fg',
		plinth: 'from-tone-slate-bg border-tone-slate-fg/40',
		step: 'h-12 sm:h-14',
	},
	3: {
		tone: 'orange',
		Icon: Award,
		chip: 'bg-tone-orange-bg text-tone-orange-fg',
		fg: 'text-tone-orange-fg',
		ring: 'ring-tone-orange-fg',
		plinth: 'from-tone-orange-bg border-tone-orange-fg/40',
		step: 'h-9 sm:h-11',
	},
};

/**
 * The medal for a rank. Only the first three placings are decorated; anything
 * lower (or a rank the server left null) falls back to bronze's shape and is
 * never rendered by the podium anyway.
 */
export function placeStyle(rank: number): PlaceStyle {
	return PLACE_STYLES[Math.min(Math.max(rank, 1), 3) as 1 | 2 | 3];
}

/** Whether a rank sits on the podium at all — the medal treatment's one gate. */
export function isPodiumRank(rank: number | null): boolean {
	return rank !== null && rank >= 1 && rank <= 3;
}
