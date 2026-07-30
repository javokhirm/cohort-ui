import { AlertCircle } from 'lucide-react';

import { formatMoney } from '@repo/utils';

import { useAppT } from '@/locales';

interface BalanceDueBannerProps {
	outstanding: number;
	currency: string;
	/** Opens Billing — the "Pay now" affordance routes there; paying itself happens at the center. */
	onOpen: () => void;
}

/**
 * The design's balance strip: alert icon, "X due", and a "Pay now" cue that opens the
 * Billing screen. Money is always formatted via `@repo/utils`, never raw `toFixed`
 * (root CLAUDE.md's money rule).
 */
export function BalanceDueBanner({
	outstanding,
	currency,
	onOpen,
}: BalanceDueBannerProps) {
	const t = useAppT('home');

	return (
		<button
			type="button"
			onClick={onOpen}
			className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-tone-amber-fg/30 bg-tone-amber-bg px-4 py-3.5 text-left shadow-sm transition-colors hover:border-primary"
		>
			<AlertCircle className="size-5 shrink-0 text-tone-amber-fg" />
			<span className="min-w-0 flex-1 text-sm font-semibold text-tone-amber-fg">
				{t('balanceDue', { amount: formatMoney(outstanding, currency) })}
			</span>
			<span className="shrink-0 text-[12.5px] font-bold text-primary">
				{t('payNow')}
			</span>
		</button>
	);
}
