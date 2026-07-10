import { TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@repo/ui';

/**
 * A small up/down delta pill. `value` is an already-scaled percentage number
 * (e.g. `18.3` for +18.3%, or `1.4` percentage points) — callers multiply a
 * fraction by 100 before passing it. Green when the movement is favourable.
 */
export function TrendChip({
	value,
	suffix = '%',
	upIsGood = true,
}: {
	value: number;
	suffix?: string;
	upIsGood?: boolean;
}) {
	const isUp = value >= 0;
	const isGood = upIsGood ? isUp : !isUp;
	const Icon = isUp ? TrendingUp : TrendingDown;
	return (
		<span
			className={cn(
				'inline-flex items-center gap-0.5 font-semibold tabular-nums',
				isGood ? 'text-tone-green-fg' : 'text-tone-red-fg',
			)}
		>
			<Icon className="size-3" />
			{isUp ? '+' : '−'}
			{Math.abs(value).toFixed(1)}
			{suffix}
		</span>
	);
}
