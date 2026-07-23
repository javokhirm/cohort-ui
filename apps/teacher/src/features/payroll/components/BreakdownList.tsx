import { formatMoney } from '@repo/utils';

import type { MyPayrollLine, MyPayrollRateType } from '../api/payroll.queries';
import { useAppT } from '@/locales';

interface BreakdownListProps {
	lines: MyPayrollLine[];
	rateType: MyPayrollRateType;
}

/**
 * The per-student story behind the figure, as a list rather than a table so it
 * reads on a phone. Revenue-share teachers see the money each student
 * contributed; fixed and hourly teachers see the same students for audit, with
 * no per-student amount (they are not paid that way).
 */
export function BreakdownList({ lines, rateType }: BreakdownListProps) {
	const t = useAppT('payroll');
	const isRevenueShare = rateType === 'PERCENT';

	if (lines.length === 0) {
		return (
			<div className="rounded-xl border border-border bg-card p-4">
				<h2 className="text-sm font-semibold">{t('studentsTitle')}</h2>
				<p className="mt-2 text-[13px] text-muted-foreground">
					{t('noCompletedSessions')}
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-border bg-card">
			<div className="border-b border-border p-4">
				<h2 className="text-sm font-semibold">{t('studentsTitle')}</h2>
				<p className="mt-0.5 text-[12px] text-muted-foreground">
					{t('breakdownSubtitle', { count: lines.length })}
				</p>
			</div>

			<ul>
				{lines.map((line) => (
					<li
						key={line.enrollmentId}
						className="flex items-start justify-between gap-3 border-b border-border p-4 last:border-b-0"
					>
						<div className="min-w-0">
							<p className="truncate text-[13px] font-medium">
								{line.studentName}
							</p>
							<p className="truncate text-[12px] text-muted-foreground">
								{line.groupName}
							</p>
							<p className="mt-1 text-[12px] tabular-nums text-muted-foreground">
								{t('sessionsCount', {
									taught: line.sessionsTaught,
									planned: line.sessionsTotalPlanned,
								})}
								{line.monthlyTuition !== null &&
									t('tuitionSuffix', {
										amount: formatMoney(line.monthlyTuition),
									})}
							</p>
						</div>

						{isRevenueShare && line.share !== null && (
							<span className="shrink-0 text-[13px] font-semibold tabular-nums">
								{formatMoney(line.share)}
							</span>
						)}
					</li>
				))}
			</ul>

			<p className="border-t border-border p-4 text-[12px] text-muted-foreground">
				{isRevenueShare ? t('revenueShareNote') : t('referenceNote')}
			</p>
		</div>
	);
}
