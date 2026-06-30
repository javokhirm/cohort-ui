import { TrendingDown, TrendingUp } from 'lucide-react';

import { formatPercent } from '@/lib/formatters/currency';

export function TrendChip({ value, upIsGood = true }: { value: number; upIsGood?: boolean }) {
	const isUp = value >= 0;
	const isGood = upIsGood ? isUp : !isUp;
	const Icon = isUp ? TrendingUp : TrendingDown;
	return (
		<span
			className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
				isGood ? 'text-tone-green-fg' : 'text-tone-red-fg'
			}`}
		>
			<Icon className="size-3" />
			{formatPercent(Math.abs(value))}
		</span>
	);
}
