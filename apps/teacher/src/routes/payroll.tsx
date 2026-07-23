import { useState } from 'react';
import { Wallet } from 'lucide-react';

import { EmptyState, Skeleton } from '@repo/ui';
import { formatMoney } from '@repo/utils';

import {
	useMyPayroll,
	useMyPayrollPeriods,
} from '@/features/payroll/api/payroll.queries';
import { AdvancesList } from '@/features/payroll/components/AdvancesList';
import { BreakdownList } from '@/features/payroll/components/BreakdownList';
import { EarningsSummary } from '@/features/payroll/components/EarningsSummary';
import { MonthPicker } from '@/features/payroll/components/MonthPicker';
import { useAppT } from '@/locales';

/**
 * The teacher's own pay (`GET /teach/payroll`, api-reference §4.9) — the design's
 * teacher view: their months only, no teacher picker and no finalize. The open
 * month is recomputed from completed sessions on every load; once the office
 * finalizes it the figures freeze.
 */
export function PayrollRoute() {
	const t = useAppT('payroll');
	const { data: periods, isPending, isError } = useMyPayrollPeriods();
	const [selected, setSelected] = useState<string | null>(null);

	// Default to the newest month the API returned (live current month first).
	const month = selected ?? periods?.[0]?.month ?? '';
	const { data: detail, isPending: detailPending } = useMyPayroll(month);

	if (isPending) {
		return (
			<div className="mx-auto w-full max-w-230">
				<Skeleton className="h-9 w-full rounded-lg" />
				<Skeleton className="mt-4 h-36 w-full rounded-xl" />
				<Skeleton className="mt-3 h-48 w-full rounded-xl" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="mx-auto w-full max-w-230">
				<div className="rounded-xl border border-border bg-card">
					<EmptyState
						icon={<Wallet />}
						title={t('errorTitle')}
						description={t('errorDescription')}
					/>
				</div>
			</div>
		);
	}

	if (!periods || periods.length === 0) {
		return (
			<div className="mx-auto w-full max-w-230">
				<div className="rounded-xl border border-border bg-card">
					<EmptyState
						icon={<Wallet />}
						title={t('emptyTitle')}
						description={t('emptyDescription')}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-230 pb-6">
			<MonthPicker periods={periods} month={month} onChange={setSelected} />

			{detailPending || !detail ? (
				<>
					<Skeleton className="mt-4 h-36 w-full rounded-xl" />
					<Skeleton className="mt-3 h-48 w-full rounded-xl" />
				</>
			) : (
				<div className="mt-4 flex flex-col gap-3">
					<EarningsSummary month={detail} />
					<AdvancesList advances={detail.advances} />
					<BreakdownList
						lines={detail.breakdown.lines}
						rateType={detail.rateType}
					/>
					<p className="px-1 text-[12px] text-muted-foreground">
						Computed from {detail.breakdown.calculation.sessionsTaught}{' '}
						completed sessions ({detail.breakdown.calculation.hoursTaught}h).
						Exact total {formatMoney(detail.breakdown.calculation.grossExact)}
						, rounded to {formatMoney(detail.breakdown.calculation.gross)}.
					</p>
				</div>
			)}
		</div>
	);
}
