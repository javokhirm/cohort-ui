import { StatusBadge } from '@repo/ui';

/**
 * The LIVE status pill — blue with a pulsing dot, signalling that the figure
 * recomputes from completed sessions until the period is finalized.
 */
export function LiveBadge() {
	return (
		<StatusBadge tone="blue">
			<span
				aria-hidden
				className="size-1.5 animate-pulse rounded-full bg-current"
			/>
			Live
		</StatusBadge>
	);
}
