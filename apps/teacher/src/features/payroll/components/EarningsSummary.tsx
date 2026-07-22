import { StatusBadge } from '@repo/ui';
import { formatMoney } from '@repo/utils';

import type { MyPayrollMonth } from '../api/payroll.queries';

/**
 * The headline figures: what the month computed to, what was already drawn as
 * advances, and what is left to be paid. Mirrors the admin detail header, laid
 * out for a phone.
 */
export function EarningsSummary({ month }: { month: MyPayrollMonth }) {
	return (
		<div className="rounded-xl border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-[13px] text-muted-foreground">Net payable</p>
					<p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
						{formatMoney(month.netAmount)}
					</p>
				</div>
				<StatusBadge kind="payroll" status={month.status} />
			</div>

			<div className="mt-4 flex items-center gap-6 border-t border-border pt-3">
				<div>
					<p className="text-[11px] text-muted-foreground">Computed</p>
					<p className="mt-0.5 text-sm font-semibold tabular-nums">
						{formatMoney(month.grossAmount)}
					</p>
				</div>
				<div>
					<p className="text-[11px] text-muted-foreground">Advances</p>
					<p className="mt-0.5 text-sm font-semibold tabular-nums text-tone-red-fg">
						{month.advancesTotal > 0
							? `−${formatMoney(month.advancesTotal)}`
							: formatMoney(0)}
					</p>
				</div>
			</div>

			{month.status === 'LIVE' && (
				<p className="mt-3 text-[12px] text-muted-foreground">
					Live — figures update from completed sessions until the period is
					finalized.
				</p>
			)}

			{month.advancesExceedGross && (
				<p className="mt-3 text-[12px] text-tone-red-fg">
					Advances exceed the computed pay — net is held at zero for this month.
				</p>
			)}
		</div>
	);
}
