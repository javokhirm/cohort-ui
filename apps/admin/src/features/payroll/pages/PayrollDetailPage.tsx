import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Undo2, Wallet } from 'lucide-react';

import { Button, Card, ConfirmDialog, Skeleton, StatusBadge, toast } from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatDate, formatMoney } from '@repo/utils';

import { usePermissions } from '@/features/auth/hooks';

import { usePayrollStaffPeriod } from '../api/payroll.queries';
import type { PayrollStaffPeriodResponse } from '../api/payroll.queries';
import { useMarkPayrollPaid, useUnfinalizePayroll } from '../api/payroll.mutations';
import { AdvancesCard } from '../components/AdvancesCard';
import { CalculationCard } from '../components/CalculationCard';
import { LiveBadge } from '../components/LiveBadge';
import { RateTypeBadge } from '../components/RateTypeBadge';
import { StudentBreakdownTable } from '../components/StudentBreakdownTable';
import { formatMonthLabel } from '../lib/month';

function initials(name: string): string {
	const [first, last] = name.split(' ');
	return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

function actionErrorMessage(err: unknown, fallback: string): string {
	if (!isApiError(err)) return fallback;
	switch (err.code) {
		case 'PAYROLL_PERIOD_FINALIZED':
			return 'This period is already finalized.';
		case 'EXPENSE_LOCKED':
			return 'The linked salary expense is locked — this record cannot change.';
		default:
			return err.message || fallback;
	}
}

function HeaderCard({ period }: { period: PayrollStaffPeriodResponse }) {
	const { can } = usePermissions();
	const [payOpen, setPayOpen] = useState(false);
	const [unfinalizeOpen, setUnfinalizeOpen] = useState(false);

	const payrollId = period.payrollId ?? 0;
	const markPaid = useMarkPayrollPaid(payrollId);
	const unfinalize = useUnfinalizePayroll(payrollId);

	function handleMarkPaid() {
		markPaid.mutate(undefined, {
			onSuccess: () => {
				toast.success('Payroll marked as paid');
				setPayOpen(false);
			},
			onError: (err) => {
				toast.error(actionErrorMessage(err, 'Failed to mark payroll as paid'));
			},
		});
	}

	function handleUnfinalize() {
		unfinalize.mutate(undefined, {
			onSuccess: () => {
				toast.success('Snapshot discarded — figures are live again');
				setUnfinalizeOpen(false);
			},
			onError: (err) => {
				toast.error(actionErrorMessage(err, 'Failed to unfinalize'));
			},
		});
	}

	const subtitle = [
		period.position,
		period.staffCode,
		`${formatDate(period.periodStart)} – ${formatDate(period.periodEnd)}`,
	]
		.filter(Boolean)
		.join(' · ');

	return (
		<Card className="gap-0 p-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex items-center gap-3.5">
					<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
						{initials(period.staffName)}
					</span>
					<div>
						<div className="flex flex-wrap items-center gap-2.5">
							<h1 className="text-lg font-bold">{period.staffName}</h1>
							{period.status === 'LIVE' ? (
								<LiveBadge />
							) : (
								<StatusBadge kind="payroll" status={period.status} />
							)}
							<RateTypeBadge
								rateType={period.rateType}
								percent={period.breakdown.calculation.percent}
							/>
						</div>
						<div className="mt-1 text-sm text-muted-foreground">
							{subtitle}
						</div>
					</div>
				</div>

				<div className="flex gap-6">
					<div className="text-right">
						<div className="text-xs text-muted-foreground">Computed</div>
						<div className="text-base font-bold tabular-nums">
							{formatMoney(period.grossAmount)}
						</div>
					</div>
					<div className="text-right">
						<div className="text-xs text-muted-foreground">Advances</div>
						<div className="text-base font-bold tabular-nums text-tone-red-fg">
							−{formatMoney(period.advancesTotal)}
						</div>
					</div>
					<div className="text-right">
						<div className="text-xs text-muted-foreground">Net payable</div>
						<div className="text-base font-bold tabular-nums text-tone-green-fg">
							{formatMoney(period.netAmount)}
						</div>
					</div>
				</div>
			</div>

			<div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
				{period.status === 'FINALIZED' && can('payroll.pay') && (
					<Button
						onClick={() => setPayOpen(true)}
						disabled={markPaid.isPending}
					>
						<Wallet className="mr-1.5 size-4" />
						Mark as paid
					</Button>
				)}
				{period.status === 'FINALIZED' && can('payroll.finalize') && (
					<Button
						variant="outline"
						onClick={() => setUnfinalizeOpen(true)}
						disabled={unfinalize.isPending}
					>
						<Undo2 className="mr-1.5 size-4" />
						Unfinalize
					</Button>
				)}
				{period.status === 'LIVE' && (
					<div className="flex items-center gap-2 text-sm text-tone-blue-fg">
						<span
							aria-hidden
							className="size-1.5 animate-pulse rounded-full bg-current"
						/>
						Live — figures update from completed sessions until the period is
						finalized.
					</div>
				)}
				{period.status === 'PAID' && period.paidAt && (
					<div className="text-sm text-muted-foreground">
						Paid on {formatDate(period.paidAt)}.
					</div>
				)}
			</div>

			<ConfirmDialog
				open={payOpen}
				onOpenChange={setPayOpen}
				title={`Mark ${formatMonthLabel(period.month)} as paid?`}
				description={`${formatMoney(period.netAmount)} net for ${period.staffName} is recorded as paid out. This cannot be undone.`}
				confirmLabel="Mark as paid"
				loading={markPaid.isPending}
				onConfirm={handleMarkPaid}
			/>

			<ConfirmDialog
				open={unfinalizeOpen}
				onOpenChange={setUnfinalizeOpen}
				title="Unfinalize this payroll?"
				description="The frozen snapshot is discarded and the figures go live again — they will recompute from completed sessions and may change before the next finalize."
				confirmLabel="Unfinalize"
				variant="destructive"
				loading={unfinalize.isPending}
				onConfirm={handleUnfinalize}
			/>
		</Card>
	);
}

interface PayrollDetailPageProps {
	staffId: number;
	/** `YYYY-MM` — the period this detail is for. */
	month: string;
}

export function PayrollDetailPage({ staffId, month }: PayrollDetailPageProps) {
	const { data: period, isLoading, isError } = usePayrollStaffPeriod(month, staffId);

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-4">
			<Link
				to="/payroll"
				search={{ month }}
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Back to payroll
			</Link>

			{isLoading ? (
				<>
					<Skeleton className="h-40 rounded-xl" />
					<Skeleton className="h-32 rounded-xl" />
				</>
			) : isError || !period ? (
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					No payroll figure for this teacher in {formatMonthLabel(month)}.
				</div>
			) : (
				<>
					<HeaderCard period={period} />
					<CalculationCard period={period} />
					<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
						<div className="lg:col-span-3">
							<StudentBreakdownTable
								lines={period.breakdown.lines}
								rateType={period.rateType}
								sessionsTaught={
									period.breakdown.calculation.sessionsTaught
								}
								hoursTaught={period.breakdown.calculation.hoursTaught}
							/>
						</div>
						<div className="lg:col-span-2">
							<AdvancesCard period={period} />
						</div>
					</div>
				</>
			)}
		</div>
	);
}
