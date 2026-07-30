import { AlertCircle } from 'lucide-react';

import { formatMoney } from '@repo/utils';

import { useAppT } from '@/locales';

interface BalanceDueBannerProps {
	outstanding: number;
	currency: string;
}

/**
 * Informational only — no "Pay now" affordance, since no payment screen exists in this
 * app yet. Money is always formatted via `@repo/utils`, never raw `toFixed` (root
 * CLAUDE.md's money rule).
 */
export function BalanceDueBanner({ outstanding, currency }: BalanceDueBannerProps) {
	const t = useAppT('home');

	return (
		<div className="flex items-center gap-3 rounded-2xl border border-tone-amber-fg/30 bg-tone-amber-bg px-4 py-3.5 text-tone-amber-fg shadow-sm">
			<AlertCircle className="size-5 shrink-0" />
			<span className="text-sm font-semibold">
				{t('balanceDue', { amount: formatMoney(outstanding, currency) })}
			</span>
		</div>
	);
}
