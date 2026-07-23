import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import {
	Button,
	Card,
	cn,
	ConfirmDialog,
	DatePicker,
	Label,
	PageHeader,
	Pagination,
	resolveStatus,
	SearchFilterBar,
	TONE_ACCENT_CLASSES,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatPrice } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';
import { usePermissions } from '@/features/auth/hooks';

import { useExpenseList, useExpenseSummary } from '../api/expenses.queries';
import type { ExpenseResponse } from '../api/expenses.queries';
import type { ExpenseListFilters } from '../api/keys';
import { useDeleteExpense } from '../api/expenses.mutations';
import { EXPENSE_CATEGORY_FILTERS } from '../lib/expense-options';
import { ExpenseTable } from '../components/ExpenseTable';
import { ExpenseForm } from '../components/ExpenseForm';

const PAGE_SIZE = 20;

export function ExpenseListPage() {
	const t = useAppT('expenses');
	const tc = useT('common');
	const statusLabel = useStatusLabel();
	const navigate = useNavigate({ from: '/expenses' });
	const { can } = usePermissions();
	const { page = 1, category, from, to } = useSearch({ from: '/_authed/expenses' });

	const [addOpen, setAddOpen] = useState(false);
	const [editExpense, setEditExpense] = useState<ExpenseResponse | null>(null);
	const [deleteExpense, setDeleteExpense] = useState<ExpenseResponse | null>(null);
	const canEdit = can('expense.update');
	const canDelete = can('expense.delete');

	const filters: ExpenseListFilters = {
		page,
		limit: PAGE_SIZE,
		category,
		from,
		to,
	};

	const { data, isLoading, isError } = useExpenseList(filters);
	const expenses = data?.rows ?? [];
	const total = data?.total ?? 0;

	const { data: summary } = useExpenseSummary({ category, from, to });
	const nonZeroCategories = summary
		? (
				Object.entries(summary.byCategory) as [
					ExpenseResponse['category'],
					number,
				][]
			).filter(([, amount]) => amount > 0)
		: [];

	const deleteMutation = useDeleteExpense();

	function handleCategoryChange(
		value: (typeof EXPENSE_CATEGORY_FILTERS)[number]['value'],
	) {
		void navigate({
			search: (prev) => ({ ...prev, category: value, page: undefined }),
		});
	}

	function handleDateChange(field: 'from' | 'to', value: string) {
		void navigate({
			search: (prev) => ({ ...prev, [field]: value || undefined, page: undefined }),
		});
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	function handleDeleteConfirm() {
		if (!deleteExpense) return;
		deleteMutation.mutate(deleteExpense.id, {
			onSuccess: () => {
				toast.success(t('deleted'));
				setDeleteExpense(null);
			},
			onError: (err) => {
				toast.error(isApiError(err) ? err.message : t('deleteFailed'));
			},
		});
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title={t('title')}
				description={t('description')}
				actions={
					<Can permission="expense.create">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							{t('add')}
						</Button>
					</Can>
				}
			/>

			<Card className="gap-0 py-0">
				<div className="flex flex-wrap items-center justify-between gap-6 px-5 py-4">
					<div>
						<p className="text-sm text-muted-foreground">
							{t('totalThisPeriod')}
						</p>
						<p className="text-2xl font-bold tabular-nums">
							{formatPrice(summary?.total ?? 0)}{' '}
							{summary?.currency ?? 'UZS'}
						</p>
					</div>
					{nonZeroCategories.length > 0 && (
						<div className="flex flex-wrap items-center gap-6">
							{nonZeroCategories.map(([cat, amount]) => (
								<div key={cat} className="flex items-center gap-2">
									<span
										className={cn(
											'size-2.5 shrink-0 rounded-sm',
											TONE_ACCENT_CLASSES[
												resolveStatus('expense', cat).tone
											].dot,
										)}
									/>
									<div className="flex flex-col">
										<span className="text-xs text-muted-foreground">
											{statusLabel('expense', cat)}
										</span>
										<span className="text-sm font-semibold tabular-nums">
											{formatPrice(amount)} UZS
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</Card>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={EXPENSE_CATEGORY_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.value
							? statusLabel('expense', f.value)
							: tc('state.all'),
						active: category === f.value,
						onClick: () => handleCategoryChange(f.value),
					}))}
					actions={
						<div className="flex items-center gap-2">
							<Label
								htmlFor="expense-from"
								className="text-xs text-muted-foreground"
							>
								{t('filterFrom')}
							</Label>
							<DatePicker
								id="expense-from"
								value={from}
								onChange={(value) =>
									handleDateChange('from', value ?? '')
								}
								className="h-8 w-37.5"
							/>
							<Label
								htmlFor="expense-to"
								className="text-xs text-muted-foreground"
							>
								{t('filterTo')}
							</Label>
							<DatePicker
								id="expense-to"
								value={to}
								onChange={(value) => handleDateChange('to', value ?? '')}
								className="h-8 w-37.5"
							/>
						</div>
					}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{t('loadError')}
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<ExpenseTable
						expenses={expenses}
						isLoading={isLoading}
						onEdit={canEdit ? setEditExpense : undefined}
						onDelete={canDelete ? setDeleteExpense : undefined}
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

			<ExpenseForm mode="create" open={addOpen} onOpenChange={setAddOpen} />
			{editExpense && (
				<ExpenseForm
					mode="edit"
					expense={editExpense}
					open={editExpense !== null}
					onOpenChange={(open) => {
						if (!open) setEditExpense(null);
					}}
				/>
			)}
			<ConfirmDialog
				open={deleteExpense !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteExpense(null);
				}}
				title={t('confirmDelete.title')}
				description={t('confirmDelete.description')}
				confirmLabel={t('confirmDelete.confirm')}
				variant="destructive"
				loading={deleteMutation.isPending}
				onConfirm={handleDeleteConfirm}
			/>
		</div>
	);
}
