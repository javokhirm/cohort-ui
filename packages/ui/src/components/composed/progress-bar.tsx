import type { StatusTone } from '@repo/ui/lib/status';
import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

const TRACK_COLOR: Record<StatusTone, string> = {
	green: 'bg-tone-green-fg',
	red: 'bg-tone-red-fg',
	amber: 'bg-tone-amber-fg',
	blue: 'bg-tone-blue-fg',
	violet: 'bg-tone-violet-fg',
	slate: 'bg-tone-slate-fg',
	indigo: 'bg-primary',
	cyan: 'bg-tone-cyan-fg',
	pink: 'bg-tone-pink-fg',
	orange: 'bg-tone-orange-fg',
	yellow: 'bg-tone-yellow-fg',
};

interface ProgressBarProps extends React.ComponentProps<'div'> {
	/** 0–100 */
	value: number;
	tone?: StatusTone;
	size?: 'sm' | 'md';
}

/**
 * Horizontal progress bar used for group capacity (TEACH), storage usage
 * (ADMIN), and grade distribution (PORTAL).
 */
function ProgressBar({
	className,
	value,
	tone = 'indigo',
	size = 'sm',
	...props
}: ProgressBarProps) {
	const pct = Math.max(0, Math.min(100, value));
	return (
		<div
			data-slot="progress-bar"
			className={cn(
				'w-full overflow-hidden rounded-full bg-muted',
				size === 'sm' ? 'h-1.5' : 'h-2.5',
				className,
			)}
			{...props}
		>
			<div
				className={cn('h-full rounded-full transition-all', TRACK_COLOR[tone])}
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}

export { ProgressBar };
export type { ProgressBarProps };
