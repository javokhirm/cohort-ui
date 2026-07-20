import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Check, Edit, Wallet } from 'lucide-react';

import { Button, Card, Separator, Skeleton, StatusBadge, toast } from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatDate, formatMoney } from '@repo/utils';

import { Can } from '@/components/Can';
import { useBranches } from '@/api/branches';
import { useAuth } from '@/features/auth/hooks';

import { usePayroll, type PayrollResponse } from '../api/payroll.queries';
import { useApprovePayroll, useMarkPayrollPaid } from '../api/payroll.mutations';
import { PayrollForm } from '../components/PayrollForm';

function staffLabel(staff: PayrollResponse['staff']) {
	if (!staff) return 'Unknown staff';
	return `${staff.firstName} ${staff.lastName}`;
}

function staffInitials(staff: PayrollResponse['staff']) {
	if (!staff) return '?';
	return `${staff.firstName?.[0] ?? ''}${staff.lastName?.[0] ?? ''}`.toUpperCase();
}

function PayrollHeader({
	payroll,
	branchName,
	onEdit,
	onApprove,
	onMarkPaid,
	actionPending,
}: {
	payroll: PayrollResponse;
	branchName: string;
	onEdit: () => void;
	onApprove: () => void;
	onMarkPaid: () => void;
	actionPending: boolean;
}) {
	return (
		<Card className="p-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex items-center gap-3.5">
					<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
						{staffInitials(payroll.staff)}
					</span>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-lg font-bold">
								{staffLabel(payroll.staff)}
							</h1>
							<StatusBadge kind="payroll" status={payroll.status} />
						</div>
						<div className="mt-1 text-sm text-muted-foreground">
							{payroll.staff?.staffCode ?? '—'} · {branchName} ·{' '}
							{formatDate(payroll.periodStart)} –{' '}
							{formatDate(payroll.periodEnd)}
						</div>
					</div>
				</div>

				<div className="flex gap-6">
					<div className="text-right">
						<div className="text-xs text-muted-foreground">Gross</div>
						<div className="text-base font-bold tabular-nums">
							{formatMoney(payroll.grossAmount)}
						</div>
					</div>
					<div className="text-right">
						<div className="text-xs text-muted-foreground">Deductions</div>
						<div className="text-base font-bold tabular-nums text-destructive">
							{formatMoney(payroll.deductions)}
						</div>
					</div>
					<div className="text-right">
						<div className="text-xs text-muted-foreground">Net</div>
						<div className="text-base font-bold tabular-nums text-tone-green-fg">
							{formatMoney(payroll.netAmount)}
						</div>
					</div>
				</div>
			</div>

			<Separator className="my-4" />

			<div className="flex flex-wrap items-center gap-2">
				{payroll.status === 'DRAFT' && (
					<Can permission="payroll.approve">
						<Button onClick={onApprove} disabled={actionPending}>
							<Check className="mr-1.5 size-4" />
							Approve
						</Button>
					</Can>
				)}
				{payroll.status === 'APPROVED' && (
					<Can permission="payroll.pay">
						<Button onClick={onMarkPaid} disabled={actionPending}>
							<Wallet className="mr-1.5 size-4" />
							Mark as paid
						</Button>
					</Can>
				)}
				{payroll.status === 'DRAFT' && (
					<Can permission="payroll.update">
						<Button variant="outline" onClick={onEdit}>
							<Edit className="mr-1.5 size-4" />
							Edit
						</Button>
					</Can>
				)}
			</div>
		</Card>
	);
}

/** "Already paid" ranges recorded on the breakdown (never paid twice). */
function SkippedRangesNote({ payroll }: { payroll: PayrollResponse }) {
	const skipped = payroll.breakdown?.skippedRanges ?? [];
	if (skipped.length === 0) return null;
	return (
		<div className="border-b border-border bg-muted/40 px-5 py-3 text-sm text-muted-foreground">
			{skipped.map((range) => (
				<p key={`${range.start}-${range.end}`}>
					{formatDate(range.start)} – {formatDate(range.end)} excluded — already
					covered by record #{range.payrollId}.
				</p>
			))}
		</div>
	);
}

function BreakdownCard({ payroll }: { payroll: PayrollResponse }) {
	const breakdown = payroll.breakdown;

	// PERCENT records carry server-computed per-student lines; everything else
	// (legacy rows have no `type`) renders the fixed hours/rate/bonuses shape.
	if (breakdown?.type === 'PERCENT') {
		return (
			<Card className="gap-0 overflow-hidden py-0">
				<div className="border-b border-border px-5 py-3">
					<h2 className="text-sm font-semibold">
						Breakdown — {breakdown.percent}% of student fees
					</h2>
				</div>
				<SkippedRangesNote payroll={payroll} />
				{breakdown.lines.length === 0 ? (
					<p className="px-5 py-4 text-sm text-muted-foreground">
						No enrolled students in this teacher&apos;s groups for the period.
					</p>
				) : (
					<div className="flex flex-col">
						{breakdown.lines.map((line) => (
							<div
								key={line.enrollmentId}
								className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-0"
							>
								<div className="min-w-0">
									<div className="truncate text-sm font-medium">
										{line.studentName}
									</div>
									<div className="truncate text-xs text-muted-foreground">
										{line.groupName} · {line.sessionsCounted}/
										{line.sessionsTotal} lessons ·{' '}
										{formatMoney(line.earnings)} earned
									</div>
								</div>
								<span className="shrink-0 text-sm font-semibold tabular-nums">
									{formatMoney(line.amount)}
								</span>
							</div>
						))}
						{breakdown.bonuses != null && breakdown.bonuses > 0 && (
							<div className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0">
								<span className="text-sm font-medium">Bonuses</span>
								<span className="text-sm font-semibold tabular-nums">
									{formatMoney(breakdown.bonuses)}
								</span>
							</div>
						)}
					</div>
				)}
				<div className="flex items-center justify-between bg-muted/40 px-5 py-3.5">
					<span className="text-sm font-medium text-destructive">
						Deductions
					</span>
					<span className="text-sm font-semibold tabular-nums text-destructive">
						-{formatMoney(payroll.deductions)}
					</span>
				</div>
				<div className="flex items-center justify-between border-t border-border px-5 py-3.5">
					<span className="text-sm font-bold">Net pay</span>
					<span className="text-base font-bold tabular-nums">
						{formatMoney(payroll.netAmount)}
					</span>
				</div>
			</Card>
		);
	}

	// The PERCENT variant returned above; what remains is the FIXED/legacy shape.
	const fixed = breakdown ?? undefined;
	const rows = [
		{ label: 'Hours taught', value: fixed?.hoursTaught },
		{
			label: 'Rate',
			value: fixed?.rate != null ? formatMoney(fixed.rate) : undefined,
		},
		{
			label: 'Bonuses',
			value: fixed?.bonuses != null ? formatMoney(fixed.bonuses) : undefined,
		},
		{
			label: 'Paid share of period',
			value:
				fixed?.proratedFactor != null
					? `${Math.round(fixed.proratedFactor * 100)}%`
					: undefined,
		},
	].filter((r) => r.value != null);

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="border-b border-border px-5 py-3">
				<h2 className="text-sm font-semibold">Breakdown</h2>
			</div>
			<SkippedRangesNote payroll={payroll} />
			{rows.length === 0 ? (
				<p className="px-5 py-4 text-sm text-muted-foreground">
					No breakdown recorded for this record.
				</p>
			) : (
				<div className="flex flex-col">
					{rows.map((r) => (
						<div
							key={r.label}
							className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0"
						>
							<span className="text-sm font-medium">{r.label}</span>
							<span className="text-sm font-semibold tabular-nums">
								{r.value}
							</span>
						</div>
					))}
				</div>
			)}
			<div className="flex items-center justify-between bg-muted/40 px-5 py-3.5">
				<span className="text-sm font-medium text-destructive">Deductions</span>
				<span className="text-sm font-semibold tabular-nums text-destructive">
					-{formatMoney(payroll.deductions)}
				</span>
			</div>
			<div className="flex items-center justify-between border-t border-border px-5 py-3.5">
				<span className="text-sm font-bold">Net pay</span>
				<span className="text-base font-bold tabular-nums">
					{formatMoney(payroll.netAmount)}
				</span>
			</div>
		</Card>
	);
}

function DetailsCard({
	payroll,
	branchName,
}: {
	payroll: PayrollResponse;
	branchName: string;
}) {
	return (
		<Card className="p-5">
			<h2 className="mb-3 text-sm font-semibold">Details</h2>
			<div className="flex flex-col gap-3 text-sm">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Branch</span>
					<span className="font-medium">{branchName}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Period</span>
					<span className="font-medium">
						{formatDate(payroll.periodStart)} –{' '}
						{formatDate(payroll.periodEnd)}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Created</span>
					<span className="font-medium">{formatDate(payroll.createdAt)}</span>
				</div>
				{payroll.paidAt && (
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Paid on</span>
						<span className="font-medium">{formatDate(payroll.paidAt)}</span>
					</div>
				)}
			</div>
		</Card>
	);
}

interface PayrollDetailPageProps {
	payrollId: number;
}

export function PayrollDetailPage({ payrollId }: PayrollDetailPageProps) {
	const { data: payroll, isLoading, isError } = usePayroll(payrollId);
	const { data: branches = [] } = useBranches();
	const { can } = useAuth();

	const [editOpen, setEditOpen] = useState(false);

	const approvePayroll = useApprovePayroll();
	const markPayrollPaid = useMarkPayrollPaid();
	const actionPending = approvePayroll.isPending || markPayrollPaid.isPending;

	async function handleApprove() {
		if (!payroll) return;
		try {
			await approvePayroll.mutateAsync(payroll.id);
			toast.success('Payroll approved');
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to approve payroll');
		}
	}

	async function handleMarkPaid() {
		if (!payroll) return;
		try {
			await markPayrollPaid.mutateAsync(payroll.id);
			toast.success('Payroll marked as paid');
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to mark payroll as paid');
		}
	}

	const branchName =
		branches.find((b) => b.id === payroll?.branchId)?.name ??
		(payroll ? `Branch #${payroll.branchId}` : '—');

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-5">
			<Link
				to="/payroll"
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Back to payroll
			</Link>

			{isLoading ? (
				<Skeleton className="h-40 rounded-xl" />
			) : isError || !payroll ? (
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					Payroll record not found.
				</div>
			) : (
				<>
					<PayrollHeader
						payroll={payroll}
						branchName={branchName}
						onEdit={() => setEditOpen(true)}
						onApprove={() => void handleApprove()}
						onMarkPaid={() => void handleMarkPaid()}
						actionPending={actionPending}
					/>

					<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
						<div className="lg:col-span-2">
							<BreakdownCard payroll={payroll} />
						</div>
						<DetailsCard payroll={payroll} branchName={branchName} />
					</div>

					{can('payroll.update') && (
						<PayrollForm
							mode="edit"
							payroll={payroll}
							open={editOpen}
							onOpenChange={setEditOpen}
						/>
					)}
				</>
			)}
		</div>
	);
}
