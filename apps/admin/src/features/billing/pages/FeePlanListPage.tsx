import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { Button, Card, PageHeader, Pagination, SearchFilterBar } from '@repo/ui';

import { Can } from '@/components/Can';
import { usePermissions } from '@/features/auth/hooks';
import { useFeePlanList } from '../api/fee-plans.queries';
import type { FeePlanResponse } from '../api/fee-plans.queries';
import type { FeePlanListFilters } from '../api/keys';
import { FEE_PLAN_STATUS_FILTERS } from '../lib/fee-plan-options';
import { FeePlanTable } from '../components/FeePlanTable';
import { FeePlanForm } from '../components/FeePlanForm';

const PAGE_SIZE = 20;

export function FeePlanListPage() {
	const navigate = useNavigate({ from: '/fee-plans' });
	const { can } = usePermissions();
	const { page = 1, status } = useSearch({ from: '/_authed/fee-plans' });

	const [addOpen, setAddOpen] = useState(false);
	const [editFeePlan, setEditFeePlan] = useState<FeePlanResponse | null>(null);
	const canEdit = can('fee-plan.manage');

	const filters: FeePlanListFilters = {
		page,
		limit: PAGE_SIZE,
		isActive: status === undefined ? undefined : status === 'active',
	};

	const { data, isLoading, isError } = useFeePlanList(filters);
	const feePlans = data?.rows ?? [];
	const total = data?.total ?? 0;

	function handleStatusChange(
		value: (typeof FEE_PLAN_STATUS_FILTERS)[number]['value'],
	) {
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
				title="Fee Plans"
				description="Reusable billing templates applied at enrollment"
				actions={
					<Can permission="fee-plan.manage">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							New fee plan
						</Button>
					</Can>
				}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={FEE_PLAN_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.label,
						active: status === f.value,
						onClick: () => handleStatusChange(f.value),
					}))}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load fee plans. Please refresh.
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<FeePlanTable
						feePlans={feePlans}
						isLoading={isLoading}
						onEdit={canEdit ? setEditFeePlan : undefined}
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

			<FeePlanForm mode="create" open={addOpen} onOpenChange={setAddOpen} />
			{editFeePlan && (
				<FeePlanForm
					mode="edit"
					feePlan={editFeePlan}
					open={editFeePlan !== null}
					onOpenChange={(open) => {
						if (!open) setEditFeePlan(null);
					}}
				/>
			)}
		</div>
	);
}
