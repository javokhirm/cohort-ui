import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Download, Plus, SearchX, X } from 'lucide-react';

import {
	ActiveFilterChips,
	Button,
	Card,
	DatePicker,
	EmptyState,
	PageHeader,
	Pagination,
	SearchFilterBar,
	StatCard,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	type ActiveFilterChip,
} from '@repo/ui';
import { formatDate, formatPrice } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { Can } from '@/components/Can';
import { FilterField } from '@/components/FilterField';
import { FilterPopover } from '@/components/FilterPopover';
import { useGroup } from '@/features/groups/api/groups.queries';
import { useStudent } from '@/features/people/api/students.queries';
import { useInvoiceList, useInvoiceSummary } from '../api/invoices.queries';
import type { InvoiceListFilters, InvoiceSummaryFilters } from '../api/keys';
import { INVOICE_STATUS_FILTERS } from '../lib/invoice-options';
import { InvoiceTable } from '../components/InvoiceTable';
import { InvoiceForm } from '../components/InvoiceForm';
import { StudentPicker } from '../components/StudentPicker';
import { GroupPicker } from '../components/GroupPicker';

const PAGE_SIZE = 20;

/** The scope filters — everything the toolbar narrows by except the status chips. */
type InvoiceScopeFilters = Pick<
	InvoiceListFilters,
	'studentId' | 'groupId' | 'from' | 'to' | 'dueBefore'
>;

export function InvoiceListPage() {
	const t = useAppT('billing');
	const tc = useT('common');
	const statusLabel = useStatusLabel();
	const navigate = useNavigate({ from: '/invoices' });
	const {
		page = 1,
		status,
		studentId,
		groupId,
		from,
		to,
		dueBefore,
	} = useSearch({
		from: '/_authed/invoices',
	});

	const [createOpen, setCreateOpen] = useState(false);

	const filters: InvoiceListFilters = {
		page,
		limit: PAGE_SIZE,
		status,
		studentId,
		groupId,
		from,
		to,
		dueBefore,
	};

	const { data, isLoading, isError } = useInvoiceList(filters);
	const invoices = data?.rows ?? [];
	const total = data?.total ?? 0;

	// The strip follows the scope filters but *not* the status chips: the scope
	// says which invoices are in play, the chips only pick which of them to list.
	// Feeding status in here would report 0/0/0 on DRAFT and VOID (the backend
	// excludes both from every figure) and a false 0 outstanding on PAID — three
	// tabs where the most important number on the page reads as an error.
	const summaryFilters: InvoiceSummaryFilters = {
		studentId,
		groupId,
		from,
		to,
		dueBefore,
	};
	const { data: summary, isLoading: isSummaryLoading } =
		useInvoiceSummary(summaryFilters);
	const statValue = (amount: number) =>
		isSummaryLoading ? '—' : `${formatPrice(amount)} UZS`;

	const { data: selectedStudent } = useStudent(studentId ?? 0);
	const { data: selectedGroup } = useGroup(groupId ?? 0);

	function patchFilters(patch: Partial<InvoiceScopeFilters>) {
		void navigate({
			search: (prev) => ({ ...prev, ...patch, page: undefined }),
		});
	}

	function handleStatusChange(value: (typeof INVOICE_STATUS_FILTERS)[number]['value']) {
		void navigate({
			search: (prev) => ({ ...prev, status: value, page: undefined }),
		});
	}

	/** One meaning of "clear", everywhere it is offered: nothing left narrowing the list. */
	function handleClearFilters() {
		void navigate({
			search: () => ({}),
		});
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	/**
	 * One chip per applied scope filter. The issue-date range is a single chip
	 * even though it is two controls — the count on the Filters trigger is taken
	 * from this list, so the badge and the chips can never disagree.
	 */
	const chips: ActiveFilterChip[] = [];
	const toChip = (
		id: string,
		label: string,
		value: string,
		onRemove: () => void,
	): ActiveFilterChip => ({
		id,
		label,
		value,
		removeLabel: t('invoices.filters.remove', { filter: label }),
		onRemove,
	});

	if (studentId != null) {
		chips.push(
			toChip(
				'student',
				t('invoices.column.student'),
				selectedStudent
					? `${selectedStudent.user.firstName} ${selectedStudent.user.lastName}`
					: tc('state.loading'),
				() => patchFilters({ studentId: undefined }),
			),
		);
	}

	if (groupId != null) {
		chips.push(
			toChip(
				'group',
				t('invoices.filters.group'),
				selectedGroup?.name ?? tc('state.loading'),
				() => patchFilters({ groupId: undefined }),
			),
		);
	}

	const issuedRange =
		from && to
			? t('invoices.filters.rangeBoth', {
					from: formatDate(from),
					to: formatDate(to),
				})
			: from
				? t('invoices.filters.rangeFrom', { from: formatDate(from) })
				: to
					? t('invoices.filters.rangeTo', { to: formatDate(to) })
					: null;

	if (issuedRange) {
		chips.push(
			toChip('issued', t('invoices.column.issued'), issuedRange, () =>
				patchFilters({ from: undefined, to: undefined }),
			),
		);
	}

	if (dueBefore) {
		chips.push(
			toChip('dueBefore', t('misc.dueBefore'), formatDate(dueBefore), () =>
				patchFilters({ dueBefore: undefined }),
			),
		);
	}

	const isFiltered = chips.length > 0 || status != null;

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title={t('invoices.title')}
				description={t('invoices.description')}
				actions={
					<>
						<Can permission="invoice.create">
							<Button onClick={() => setCreateOpen(true)}>
								<Plus className="mr-1.5 size-4" />
								{t('invoices.create')}
							</Button>
						</Can>
					</>
				}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard
					label={t('generate.totalInvoiced')}
					value={statValue(summary?.totalInvoiced ?? 0)}
				/>
				<StatCard
					label={t('feePlanExtra.collected')}
					value={
						<span className="text-tone-green-fg">
							{statValue(summary?.collected ?? 0)}
						</span>
					}
				/>
				<StatCard
					label={t('feePlanExtra.outstanding')}
					value={
						<span className="text-tone-red-fg">
							{statValue(summary?.outstanding ?? 0)}
						</span>
					}
				/>
			</div>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={INVOICE_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.value
							? statusLabel('invoice', f.value)
							: tc('state.all'),
						active: status === f.value,
						onClick: () => handleStatusChange(f.value),
					}))}
					actions={
						<>
							<FilterPopover
								label={t('invoices.filters.title')}
								count={chips.length}
								footer={
									<Button
										variant="ghost"
										size="sm"
										onClick={handleClearFilters}
									>
										<X className="mr-1.5 size-3.5" />
										{t('misc.clearFilters')}
									</Button>
								}
							>
								<FilterField label={t('invoices.column.student')}>
									<StudentPicker
										value={studentId}
										onChange={(value) =>
											patchFilters({ studentId: value })
										}
										onClear={() =>
											patchFilters({ studentId: undefined })
										}
									/>
								</FilterField>
								<FilterField label={t('invoices.filters.group')}>
									<GroupPicker
										value={groupId}
										onChange={(value) =>
											patchFilters({ groupId: value })
										}
										onClear={() =>
											patchFilters({ groupId: undefined })
										}
									/>
								</FilterField>
								<div className="flex gap-3">
									<FilterField
										label={t('misc.issuedFrom')}
										htmlFor="invoice-from"
										className="flex-1"
									>
										<DatePicker
											id="invoice-from"
											value={from}
											maxDate={to}
											onChange={(value) =>
												patchFilters({ from: value })
											}
										/>
									</FilterField>
									<FilterField
										label={t('misc.issuedTo')}
										htmlFor="invoice-to"
										className="flex-1"
									>
										<DatePicker
											id="invoice-to"
											value={to}
											minDate={from}
											onChange={(value) =>
												patchFilters({ to: value })
											}
										/>
									</FilterField>
								</div>
								<FilterField
									label={t('misc.dueBefore')}
									htmlFor="invoice-due-before"
								>
									<DatePicker
										id="invoice-due-before"
										value={dueBefore}
										onChange={(value) =>
											patchFilters({ dueBefore: value })
										}
									/>
								</FilterField>
							</FilterPopover>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="inline-flex">
										<Button variant="outline" disabled>
											<Download className="mr-1.5 size-4" />
											{tc('action.export')}
										</Button>
									</span>
								</TooltipTrigger>
								<TooltipContent>
									{t('invoiceExtra.notAvailableYet')}
								</TooltipContent>
							</Tooltip>
						</>
					}
				/>

				<ActiveFilterChips
					chips={chips}
					action={
						<Button variant="ghost" size="sm" onClick={handleClearFilters}>
							<X className="mr-1.5 size-3.5" />
							{t('misc.clearFilters')}
						</Button>
					}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{t('invoices.loadError')}
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<InvoiceTable
						invoices={invoices}
						isLoading={isLoading}
						onRowClick={(invoice) =>
							void navigate({
								to: '/invoices/$id',
								params: { id: String(invoice.id) },
							})
						}
						emptyState={
							isFiltered ? (
								<EmptyState
									icon={<SearchX />}
									title={t('invoices.emptyFiltered')}
									action={
										<Button
											variant="outline"
											size="sm"
											onClick={handleClearFilters}
										>
											{t('misc.clearFilters')}
										</Button>
									}
								/>
							) : undefined
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

			<InvoiceForm mode="create" open={createOpen} onOpenChange={setCreateOpen} />
		</div>
	);
}
