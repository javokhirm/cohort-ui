import { formatDate, formatMoney } from '@repo/utils';

import type { MyPayrollAdvance } from '../api/payroll.queries';
import { useAppT } from '@/locales';

/**
 * Salary already drawn this month, read-only: teachers see what was deducted
 * and when, but only the office can record or remove an advance.
 */
export function AdvancesList({ advances }: { advances: MyPayrollAdvance[] }) {
	const t = useAppT('payroll');
	if (advances.length === 0) return null;

	return (
		<div className="rounded-xl border border-border bg-card">
			<div className="border-b border-border p-4">
				<h2 className="text-sm font-semibold">{t('advancesTitle')}</h2>
				<p className="mt-0.5 text-[12px] text-muted-foreground">
					{t('advancesHint')}
				</p>
			</div>

			<ul>
				{advances.map((advance) => (
					<li
						key={advance.id}
						className="flex items-center justify-between gap-3 border-b border-border p-4 last:border-b-0"
					>
						<div className="min-w-0">
							<p className="truncate text-[13px] font-medium">
								{advance.label ?? t('advanceFallback')}
							</p>
							<p className="text-[12px] text-muted-foreground">
								{formatDate(advance.advanceDate)}
							</p>
						</div>
						<span className="shrink-0 text-[13px] font-semibold tabular-nums text-tone-red-fg">
							−{formatMoney(advance.amount)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
