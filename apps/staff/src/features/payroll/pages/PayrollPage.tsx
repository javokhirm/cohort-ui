import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Wallet } from 'lucide-react';

import { Button, Card, PageHeader, Pagination, SearchFilterBar } from '@repo/ui';
import { formatMoney } from '@repo/utils';

import { useAuth } from '@/features/auth/hooks';

import { usePayrollList } from '../api/payroll.queries';
import type { PayrollListFilters, PayrollStatus } from '../api/keys';
import { PayrollTable } from '../components/PayrollTable';
import { RunPayrollDialog } from '../components/RunPayrollDialog';

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: PayrollStatus | undefined; label: string }[] = [
	{ value: undefined, label: 'All' },
	{ value: 'DRAFT', label: 'Draft' },
	{ value: 'APPROVED', label: 'Approved' },
	{ value: 'PAID', label: 'Paid' },
];

export function PayrollPage() {
	const navigate = useNavigate();
	const { page = 1, status } = useSearch({ from: '/_authed/payroll' });
	const { hasRole } = useAuth();
	const canManage = hasRole(['OWNER']);

	const [runOpen, setRunOpen] = useState(false);

	const filters: PayrollListFilters = {
		page,
		limit: PAGE_SIZE,
		status,
	};

	const { data, isLoading, isError } = usePayrollList(filters);
	const payrolls = data?.rows ?? [];
	const total = data?.total ?? 0;
	const totalNet = payrolls.reduce((sum, p) => sum + p.netAmount, 0);

	function handleStatusChange(value: PayrollStatus | undefined) {
		void navigate({
			search: (prev) => ({ ...prev, status: value, page: undefined }),
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
					canManage ? (
						<Button onClick={() => setRunOpen(true)}>
							<Wallet className="mr-1.5 size-4" />
							Run payroll
						</Button>
					) : undefined
				}
			/>

			<Card>
				<div className="flex items-center justify-between px-5 py-4">
					<div>
						<p className="text-sm text-muted-foreground">Total net payable</p>
						<p className="text-2xl font-bold tabular-nums">
							{formatMoney(totalNet)}
						</p>
					</div>
					<p className="text-xs font-medium text-muted-foreground">
						Draft → Approved → Paid
					</p>
				</div>
			</Card>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.label,
						active: status === f.value,
						onClick: () => handleStatusChange(f.value),
					}))}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load payroll. Please refresh.
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<PayrollTable
						payrolls={payrolls}
						isLoading={isLoading}
						canManage={canManage}
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

			{canManage && <RunPayrollDialog open={runOpen} onOpenChange={setRunOpen} />}
		</div>
	);
}
