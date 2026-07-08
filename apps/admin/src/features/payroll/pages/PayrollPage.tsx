import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus, Wallet, X } from 'lucide-react';

import {
	Button,
	Card,
	Input,
	Label,
	PageHeader,
	Pagination,
	SearchFilterBar,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	StatCard,
} from '@repo/ui';
import { formatMoney } from '@repo/utils';

import { useAuth } from '@/features/auth/hooks';
import { useStaffList } from '@/features/hr/api/staff.queries';

import { usePayrollList, usePayrollSummary } from '../api/payroll.queries';
import type {
	PayrollListFilters,
	PayrollStatus,
	PayrollSummaryFilters,
} from '../api/keys';
import { PayrollTable } from '../components/PayrollTable';
import { PayrollForm } from '../components/PayrollForm';
import { RunPayrollDialog } from '../components/RunPayrollDialog';

const PAGE_SIZE = 20;
const ALL_STAFF = 'all';

const STATUS_FILTERS: { value: PayrollStatus | undefined; label: string }[] = [
	{ value: undefined, label: 'All' },
	{ value: 'DRAFT', label: 'Draft' },
	{ value: 'APPROVED', label: 'Approved' },
	{ value: 'PAID', label: 'Paid' },
];

export function PayrollPage() {
	const navigate = useNavigate({ from: '/payroll' });
	const {
		page = 1,
		status,
		staffId,
		periodFrom,
		periodTo,
	} = useSearch({
		from: '/_authed/payroll',
	});
	const { can } = useAuth();
	const canRun = can('payroll.create');
	const canApprove = can('payroll.approve');
	const canPay = can('payroll.pay');

	const [runOpen, setRunOpen] = useState(false);
	const [addOpen, setAddOpen] = useState(false);

	const { data: staffData } = useStaffList({ limit: 100 });
	const staffOptions = staffData?.rows ?? [];

	const filters: PayrollListFilters = {
		page,
		limit: PAGE_SIZE,
		status,
		staffId,
		periodFrom,
		periodTo,
	};

	const { data, isLoading, isError } = usePayrollList(filters);
	const payrolls = data?.rows ?? [];
	const total = data?.total ?? 0;

	// The strip mirrors the currently applied filters (minus pagination), same
	// as the list — so it reads as "totals for what's on screen".
	const summaryFilters: PayrollSummaryFilters = {
		status,
		staffId,
		periodFrom,
		periodTo,
	};
	const { data: summary, isLoading: isSummaryLoading } =
		usePayrollSummary(summaryFilters);
	const statValue = (amount: number) => (isSummaryLoading ? '—' : formatMoney(amount));

	const hasExtraFilters = staffId != null || !!periodFrom || !!periodTo;

	function handleStatusChange(value: PayrollStatus | undefined) {
		void navigate({
			search: (prev) => ({ ...prev, status: value, page: undefined }),
		});
	}

	function handleStaffChange(value: string) {
		void navigate({
			search: (prev) => ({
				...prev,
				staffId: value === ALL_STAFF ? undefined : Number(value),
				page: undefined,
			}),
		});
	}

	function handleDateChange(field: 'periodFrom' | 'periodTo', value: string) {
		void navigate({
			search: (prev) => ({ ...prev, [field]: value || undefined, page: undefined }),
		});
	}

	function handleClearExtraFilters() {
		void navigate({
			search: (prev) => ({
				...prev,
				staffId: undefined,
				periodFrom: undefined,
				periodTo: undefined,
				page: undefined,
			}),
		});
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title="Payroll"
				description="Gross, deductions and net by staff member"
				actions={
					<div className="flex gap-2">
						{canRun && (
							<Button variant="outline" onClick={() => setAddOpen(true)}>
								<Plus className="mr-1.5 size-4" />
								Add payroll
							</Button>
						)}
						{canRun && (
							<Button onClick={() => setRunOpen(true)}>
								<Wallet className="mr-1.5 size-4" />
								Run payroll
							</Button>
						)}
					</div>
				}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard
					label="Total gross"
					value={statValue(summary?.totalGross ?? 0)}
				/>
				<StatCard
					label="Total deductions"
					value={
						<span className="text-tone-red-fg">
							{statValue(summary?.totalDeductions ?? 0)}
						</span>
					}
				/>
				<StatCard
					label="Total net payable"
					value={
						<span className="text-tone-green-fg">
							{statValue(summary?.totalNetPayable ?? 0)}
						</span>
					}
				/>
			</div>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.label,
						active: status === f.value,
						onClick: () => handleStatusChange(f.value),
					}))}
				/>

				<div className="flex flex-wrap items-end gap-4">
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
					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="payroll-period-from"
							className="text-xs text-muted-foreground"
						>
							Period from
						</Label>
						<Input
							id="payroll-period-from"
							type="date"
							value={periodFrom ?? ''}
							onChange={(e) =>
								handleDateChange('periodFrom', e.target.value)
							}
							className="h-9 w-37.5"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="payroll-period-to"
							className="text-xs text-muted-foreground"
						>
							Period to
						</Label>
						<Input
							id="payroll-period-to"
							type="date"
							value={periodTo ?? ''}
							onChange={(e) => handleDateChange('periodTo', e.target.value)}
							className="h-9 w-37.5"
						/>
					</div>
					{hasExtraFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClearExtraFilters}
						>
							<X className="mr-1.5 size-3.5" />
							Clear filters
						</Button>
					)}
				</div>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load payroll. Please refresh.
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<PayrollTable
						payrolls={payrolls}
						isLoading={isLoading}
						canApprove={canApprove}
						canPay={canPay}
						onRowClick={(payroll) =>
							void navigate({
								to: '/payroll/$id',
								params: { id: String(payroll.id) },
							})
						}
					/>
					<div className="border-t border-border px-4 py-3">
						<Pagination
							page={page}
							pageSize={PAGE_SIZE}
							total={total}
							onPageChange={handlePage}
						/>
					</div>
				</Card>
			</div>

			{canRun && <RunPayrollDialog open={runOpen} onOpenChange={setRunOpen} />}
			{canRun && (
				<PayrollForm mode="create" open={addOpen} onOpenChange={setAddOpen} />
			)}
		</div>
	);
}
