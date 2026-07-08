import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { Button, Card, PageHeader, Pagination, SearchFilterBar } from '@repo/ui';

import { Can } from '@/components/Can';
import { usePermissions } from '@/features/auth/hooks';
import { useDiscountList } from '../api/discounts.queries';
import type { DiscountResponse } from '../api/discounts.queries';
import type { DiscountListFilters } from '../api/keys';
import { DISCOUNT_STATUS_FILTERS } from '../lib/discount-options';
import { DiscountTable } from '../components/DiscountTable';
import { DiscountForm } from '../components/DiscountForm';

const PAGE_SIZE = 20;

export function DiscountListPage() {
	const navigate = useNavigate();
	const { can } = usePermissions();
	const { page = 1, status } = useSearch({ from: '/_authed/discounts' });

	const [addOpen, setAddOpen] = useState(false);
	const [editDiscount, setEditDiscount] = useState<DiscountResponse | null>(null);
	const canEdit = can('discount.manage');

	const filters: DiscountListFilters = {
		page,
		limit: PAGE_SIZE,
		isActive: status === undefined ? undefined : status === 'active',
	};

	const { data, isLoading, isError } = useDiscountList(filters);
	const discounts = data?.rows ?? [];
	const total = data?.total ?? 0;

	function handleStatusChange(
		value: (typeof DISCOUNT_STATUS_FILTERS)[number]['value'],
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
				title="Discounts"
				description="Scholarships, promo codes, and sibling discounts"
				actions={
					<Can permission="discount.manage">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							New discount
						</Button>
					</Can>
				}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={DISCOUNT_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.label,
						active: status === f.value,
						onClick: () => handleStatusChange(f.value),
					}))}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load discounts. Please refresh.
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<DiscountTable
						discounts={discounts}
						isLoading={isLoading}
						onEdit={canEdit ? setEditDiscount : undefined}
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

			<DiscountForm mode="create" open={addOpen} onOpenChange={setAddOpen} />
			{editDiscount && (
				<DiscountForm
					mode="edit"
					discount={editDiscount}
					open={editDiscount !== null}
					onOpenChange={(open) => {
						if (!open) setEditDiscount(null);
					}}
				/>
			)}
		</div>
	);
}
