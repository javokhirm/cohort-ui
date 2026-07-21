import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Check, Download, Lock } from 'lucide-react';

import {
	Button,
	Card,
	Label,
	PageHeader,
	SearchFilterBar,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	StatCard,
} from '@repo/ui';
import { formatMoney } from '@repo/utils';

import { usePermissions } from '@/features/auth/hooks';
import { useStaffList } from '@/features/hr/api/staff.queries';
import { useActiveBranchIds } from '@/store/branchStore';

import { usePayrollPeriod } from '../api/payroll.queries';
import type { PayrollRowStatus } from '../api/keys';
import { FinalizePeriodDialog } from '../components/FinalizePeriodDialog';
import { PayrollPeriodTable } from '../components/PayrollPeriodTable';
import { PeriodSelector } from '../components/PeriodSelector';
import { buildPayrollCsv, downloadCsv } from '../lib/export-csv';
import { currentMonth, formatMonthLabel } from '../lib/month';

const ALL_STAFF = 'all';

const STATUS_FILTERS: { value: PayrollRowStatus | undefined; label: string }[] = [
	{ value: undefined, label: 'All' },
	{ value: 'LIVE', label: 'Live' },
	{ value: 'FINALIZED', label: 'Finalized' },
	{ value: 'PAID', label: 'Paid' },
];

export function PayrollPage() {
	const navigate = useNavigate({ from: '/payroll' });
	const search = useSearch({ from: '/_authed/payroll' });
	const month = search.month ?? currentMonth();
	const { status, staffId } = search;

	const { can } = usePermissions();
	const activeBranchIds = useActiveBranchIds();
	const [finalizeOpen, setFinalizeOpen] = useState(false);

	const { data: staffData } = useStaffList({ limit: 100 });
	const staffOptions = staffData?.rows ?? [];

	const { data, isLoading, isError } = usePayrollPeriod(month, { status, staffId });
	const rows = data?.rows ?? [];
	const summary = data?.summary;
	const periodFinalized = data?.periodStatus === 'FINALIZED';
	const statValue = (amount: number | undefined) =>
		amount == null ? '—' : formatMoney(amount);

	function handleMonthChange(value: string) {
		void navigate({
			search: (prev) => ({
				...prev,
				month: value === currentMonth() ? undefined : value,
			}),
		});
	}

	function handleStatusChange(value: PayrollRowStatus | undefined) {
		void navigate({ search: (prev) => ({ ...prev, status: value }) });
	}

	function handleStaffChange(value: string) {
		void navigate({
			search: (prev) => ({
				...prev,
				staffId: value === ALL_STAFF ? undefined : Number(value),
			}),
		});
	}

	function handleExport() {
		downloadCsv(`payroll-${month}.csv`, buildPayrollCsv(rows));
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title="Payroll"
				description={`${formatMonthLabel(month)} · computed per teacher from sessions taught & students`}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<PeriodSelector month={month} onMonthChange={handleMonthChange} />
						<Button
							variant="outline"
							onClick={handleExport}
							disabled={rows.length === 0}
						>
							<Download className="mr-1.5 size-4" />
							Export
						</Button>
						{periodFinalized ? (
							<div className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-muted px-3 text-sm font-semibold text-muted-foreground">
								<Check className="size-4" />
								Finalized
							</div>
						) : (
							can('payroll.finalize') && (
								<Button
									onClick={() => setFinalizeOpen(true)}
									disabled={!summary || rows.length === 0}
								>
									<Lock className="mr-1.5 size-4" />
									Finalize period
								</Button>
							)
						)}
					</div>
				}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard
					label="Total computed"
					value={statValue(summary?.totalComputed)}
				/>
				<StatCard
					label="Mid-month advances"
					value={
						<span className="text-tone-red-fg">
							{statValue(summary?.totalAdvances)}
						</span>
					}
				/>
				<StatCard
					label="Net payable"
					value={
						<span className="text-tone-green-fg">
							{statValue(summary?.totalNetPayable)}
						</span>
					}
				/>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-end gap-4">
					<SearchFilterBar
						filters={STATUS_FILTERS.map((f) => ({
							id: f.value ?? 'ALL',
							label: f.label,
							active: status === f.value,
							onClick: () => handleStatusChange(f.value),
						}))}
					/>
					<div className="flex flex-col gap-1.5">
						<Label className="text-xs text-muted-foreground">Staff</Label>
						<Select
							value={staffId ? String(staffId) : ALL_STAFF}
							onValueChange={handleStaffChange}
						>
							<SelectTrigger className="h-9 w-52" size="sm">
								<SelectValue placeholder="All staff" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_STAFF}>All staff</SelectItem>
								{staffOptions.map((s) => (
									<SelectItem key={s.id} value={String(s.id)}>
										{s.user.firstName} {s.user.lastName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{data != null && data.excludedCount > 0 && (
					<p className="text-sm text-muted-foreground">
						{data.excludedCount} staff excluded — no active payroll config
						this month.
					</p>
				)}

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load payroll. Please refresh.
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<PayrollPeriodTable
						rows={rows}
						isLoading={isLoading}
						onRowClick={(row) =>
							void navigate({
								to: '/payroll/$staffId',
								params: { staffId: String(row.staffId) },
								search: { month },
							})
						}
					/>
				</Card>
			</div>

			{summary && (
				<FinalizePeriodDialog
					open={finalizeOpen}
					onOpenChange={setFinalizeOpen}
					month={month}
					summary={summary}
					branchId={
						activeBranchIds?.length === 1 ? activeBranchIds[0] : undefined
					}
				/>
			)}
		</div>
	);
}
