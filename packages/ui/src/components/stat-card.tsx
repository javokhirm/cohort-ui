import * as React from 'react';

import { cn } from '../lib/utils';
import { Card } from './card';

const deltaToneClass: Record<'positive' | 'negative' | 'neutral', string> = {
	positive: 'text-tone-green-fg',
	negative: 'text-tone-red-fg',
	neutral: 'text-muted-foreground',
};

interface StatCardProps extends React.ComponentProps<typeof Card> {
	label: React.ReactNode;
	value: React.ReactNode;
	/** Small leading icon, typically a lucide icon element. */
	icon?: React.ReactNode;
	/** Trend delta shown under the value; `trend` colors it. */
	delta?: {
		value: React.ReactNode;
		trend?: 'positive' | 'negative' | 'neutral';
	};
	/** Muted helper text shown next to the delta. */
	hint?: React.ReactNode;
}

/**
 * Dashboard KPI card — label + value with an optional icon chip and a colored
 * trend delta. Mirrors the metric cards across the MANAGE/ADMIN dashboards.
 */
function StatCard({
	className,
	label,
	value,
	icon,
	delta,
	hint,
	...props
}: StatCardProps) {
	return (
		<Card className={cn('gap-0 py-0', className)} {...props}>
			<div className="flex items-start justify-between gap-2 p-3 sm:gap-3 sm:p-5">
				<div className="flex min-w-0 flex-col gap-1 sm:gap-2">
					<span className="truncate text-xs text-muted-foreground sm:text-sm">
						{label}
					</span>
					<span className="truncate text-lg font-bold tabular-nums tracking-tight sm:text-2xl">
						{value}
					</span>
					{(delta || hint) && (
						<div className="flex items-center gap-1.5 text-xs">
							{delta && (
								<span
									className={cn(
										'font-semibold tabular-nums',
										deltaToneClass[delta.trend ?? 'neutral'],
									)}
								>
									{delta.value}
								</span>
							)}
							{hint && (
								<span className="text-muted-foreground">{hint}</span>
							)}
						</div>
					)}
				</div>
				{icon && (
					<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-tone-indigo-bg text-tone-indigo-fg [&>svg]:size-3.5 sm:size-9 sm:[&>svg]:size-4">
						{icon}
					</span>
				)}
			</div>
		</Card>
	);
}

export { StatCard };
export type { StatCardProps };
