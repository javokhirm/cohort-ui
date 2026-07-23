import { StatusBadge } from '@repo/ui';
import { useAppT } from '@/locales';

/**
 * The LIVE status pill — blue with a pulsing dot, signalling that the figure
 * recomputes from completed sessions until the period is finalized.
 */
export function LiveBadge() {
	const t = useAppT('payroll');
	return (
		<StatusBadge tone="blue">
			<span
				aria-hidden
				className="size-1.5 animate-pulse rounded-full bg-current"
			/>
			{t('live')}
		</StatusBadge>
	);
}
