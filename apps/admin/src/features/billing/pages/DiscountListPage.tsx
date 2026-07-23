import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus, Tag } from 'lucide-react';

import { Button, EmptyState, PageHeader, SearchFilterBar, Spinner } from '@repo/ui';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { Can } from '@/components/Can';
import { usePermissions } from '@/features/auth/hooks';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { useInfiniteDiscountList } from '../api/discounts.queries';
import type { DiscountResponse } from '../api/discounts.queries';
import type { DiscountListFilters } from '../api/keys';
import { DISCOUNT_STATUS_FILTERS } from '../lib/discount-options';
import { DiscountCard } from '../components/DiscountCard';
import { DiscountForm } from '../components/DiscountForm';

const PAGE_SIZE = 12;

export function DiscountListPage() {
	const t = useAppT('billing');
	const tc = useT('common');
	const navigate = useNavigate({ from: '/discounts' });
	const { can } = usePermissions();
	const { status, search: searchParam } = useSearch({ from: '/_authed/discounts' });

	const [inputValue, setInputValue] = useState(searchParam ?? '');
	const [addOpen, setAddOpen] = useState(false);
	const [editDiscount, setEditDiscount] = useState<DiscountResponse | null>(null);
	const canEdit = can('discount.manage');

	// Keep the box in sync when the URL search param is cleared/changed externally
	// (e.g. navigating via the sidebar). Mirrors the staff/course list convention.
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setInputValue(searchParam ?? '');
	}, [searchParam]);

	// Debounce free-text search into the URL so we don't refetch on every keystroke.
	useEffect(() => {
		const timer = setTimeout(() => {
			const trimmed = inputValue.trim() || undefined;
			if (trimmed === (searchParam || undefined)) return;
			void navigate({ search: (prev) => ({ ...prev, search: trimmed }) });
		}, 350);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [inputValue]);

	const filters: Omit<DiscountListFilters, 'page'> = {
		limit: PAGE_SIZE,
		isActive: status === undefined ? undefined : status === 'active',
		search: searchParam || undefined,
	};

	const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteDiscountList(filters);
	const discounts = data?.pages.flatMap((p) => p.rows) ?? [];

	const sentinelRef = useInfiniteScrollSentinel({
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	});

	function handleStatusChange(
		value: (typeof DISCOUNT_STATUS_FILTERS)[number]['value'],
	) {
		void navigate({ search: (prev) => ({ ...prev, status: value }) });
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title={t('discounts.title')}
				description={t('discounts.description')}
				actions={
					<Can permission="discount.manage">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							{t('discounts.add')}
						</Button>
					</Can>
				}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					searchValue={inputValue}
					onSearchChange={setInputValue}
					searchPlaceholder="Search discounts…"
					filters={DISCOUNT_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: tc(`state.${f.labelKey}`),
						active: status === f.value,
						onClick: () => handleStatusChange(f.value),
					}))}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{t('discounts.loadError')}
					</div>
				)}

				{isLoading ? (
					<div className="flex items-center justify-center py-16 text-muted-foreground">
						<Spinner className="size-5" />
					</div>
				) : discounts.length > 0 ? (
					<>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{discounts.map((discount) => (
								<DiscountCard
									key={discount.id}
									discount={discount}
									onEdit={canEdit ? setEditDiscount : undefined}
								/>
							))}
						</div>
						{hasNextPage && (
							<div ref={sentinelRef} className="flex justify-center py-4">
								{isFetchingNextPage && <Spinner className="size-5" />}
							</div>
						)}
					</>
				) : (
					!isError && (
						<EmptyState
							icon={<Tag />}
							title={t('discountExtra.emptyTitle')}
							description={t('discountExtra.emptyDescription')}
						/>
					)
				)}
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
