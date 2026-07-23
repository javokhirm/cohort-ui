import { TriangleAlert } from 'lucide-react';

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatMoney } from '@repo/utils';

import { useFinalizePeriod } from '../api/payroll.mutations';
import type { PayrollPeriodSummary } from '../api/payroll.queries';
import { currentMonth, formatMonthLabel } from '../lib/month';
import { useAppT } from '@/locales';
import { useT } from '@repo/i18n';

interface FinalizePeriodDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	month: string;
	summary: PayrollPeriodSummary;
	/** Scope the run to one branch (when exactly one branch is active). */
	branchId?: number;
}

/**
 * Freeze the month into per-teacher snapshots. Finalizing the *current* month
 * is called out hard: sessions completed after the freeze are not paid this
 * month (they surface next period at the earliest).
 */
export function FinalizePeriodDialog({
	open,
	onOpenChange,
	month,
	summary,
	branchId,
}: FinalizePeriodDialogProps) {
	const t = useAppT('payroll');
	const tc = useT('common');
	const finalizePeriod = useFinalizePeriod();
	const isCurrentMonth = month === currentMonth();

	function handleConfirm() {
		finalizePeriod.mutate(
			{ month, branchId },
			{
				onSuccess: (result) => {
					toast.success(
						t('finalize.done', {
							finalized: result.finalized,
							skipped: result.skipped,
						}),
					);
					onOpenChange(false);
				},
				onError: (err) => {
					toast.error(isApiError(err) ? err.message : t('finalize.failed'));
				},
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{t('finalize.title', { month: formatMonthLabel(month) })}
					</DialogTitle>
					<DialogDescription>
						{t('finalize.description', { count: summary.staffCount })}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-2 rounded-lg bg-muted/40 px-4 py-3 text-sm">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">
							{t('stat.totalComputed')}
						</span>
						<span className="font-semibold tabular-nums">
							{formatMoney(summary.totalComputed)}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">
							{t('stat.advances')}
						</span>
						<span className="font-semibold tabular-nums text-tone-red-fg">
							−{formatMoney(summary.totalAdvances)}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="font-semibold">{t('stat.netPayable')}</span>
						<span className="font-bold tabular-nums text-tone-green-fg">
							{formatMoney(summary.totalNetPayable)}
						</span>
					</div>
				</div>

				{isCurrentMonth && (
					<div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						<TriangleAlert className="mt-0.5 size-4 shrink-0" />
						<span>{t('finalize.currentMonthWarning')}</span>
					</div>
				)}

				<DialogFooter className="gap-2 sm:gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={finalizePeriod.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button onClick={handleConfirm} disabled={finalizePeriod.isPending}>
						{finalizePeriod.isPending ? t('finalizing') : t('finalizePeriod')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
