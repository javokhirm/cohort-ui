import { ChevronRight, Wallet } from 'lucide-react';

import { cn } from '@repo/ui';
import { formatMoney } from '@repo/utils';

import { FOCUS_RING } from '@/lib/clickable-card';
import { useAppT } from '@/locales';

interface BalanceDueBannerProps {
	outstanding: number;
	currency: string;
	/** Opens Billing — the "Pay now" affordance routes there; paying itself happens at the center. */
	onOpen: () => void;
}

/**
 * The outstanding-balance strip: what is owed, and a way through to Billing.
 *
 * Amber rather than red on purpose. A student is not the payer — this is
 * information to carry home, not a failure to answer for — so it stays visible
 * without adopting the register of an error. The tone is an amber chip and an
 * amber border on the app's ordinary panel, the same way `InvoiceCard` marks an
 * overdue invoice, rather than a filled amber strip: a card that shouts over the
 * hero would put the loudest thing on Home on the one line a student can do
 * least about.
 *
 * Money is always formatted via `@repo/utils`, never raw `toFixed` (root
 * CLAUDE.md's money rule).
 *
 * A real `<button>`, unlike Home's cards: the content is a line of text and a
 * label, so nothing here forbids it and it needs none of `clickableCardProps` —
 * only the shared ring, so it focuses like everything around it.
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
			className={cn(
				'flex w-full cursor-pointer items-center gap-3 rounded-xl border border-tone-amber-fg/40 bg-card p-4 text-left shadow-xs transition-colors hover:border-tone-amber-fg',
				FOCUS_RING,
			)}
		>
			<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tone-amber-bg text-tone-amber-fg">
				<Wallet className="size-4.5" />
			</span>
			<span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
				{t('balanceDue', { amount: formatMoney(outstanding, currency) })}
			</span>
			<span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary">
				{t('payNow')}
				<ChevronRight className="size-3.5" />
			</span>
		</button>
	);
}
