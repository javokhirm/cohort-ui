import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { CalendarClock, Download, Plus, X } from 'lucide-react';

import {
	Button,
	Card,
	DatePicker,
	Label,
	PageHeader,
	Pagination,
	SearchFilterBar,
	StatCard,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@repo/ui';
import { formatPrice } from '@repo/utils';

import { Can } from '@/components/Can';
import { useInvoiceList, useInvoiceSummary } from '../api/invoices.queries';
import type { InvoiceListFilters, InvoiceSummaryFilters } from '../api/keys';
import { INVOICE_STATUS_FILTERS } from '../lib/invoice-options';
import { InvoiceTable } from '../components/InvoiceTable';
import { InvoiceForm } from '../components/InvoiceForm';
import { GenerateInvoicesDialog } from '../components/GenerateInvoicesDialog';
import { StudentPicker } from '../components/StudentPicker';

const PAGE_SIZE = 20;

export function InvoiceListPage() {
	const navigate = useNavigate({ from: '/invoices' });
	const {
		page = 1,
		status,
		studentId,
		from,
		to,
		dueBefore,
	} = useSearch({
		from: '/_authed/invoices',
	});

	const [createOpen, setCreateOpen] = useState(false);
	const [generateOpen, setGenerateOpen] = useState(false);

	const filters: InvoiceListFilters = {
		page,
		limit: PAGE_SIZE,
		status,
		studentId,
		from,
		to,
		dueBefore,
	};

	const { data, isLoading, isError } = useInvoiceList(filters);
	const invoices = data?.rows ?? [];
	const total = data?.total ?? 0;

	// The strip mirrors the currently applied filters (minus pagination), same
	// as the list — so it reads as "totals for what's on screen".
	const summaryFilters: InvoiceSummaryFilters = {
		status,
		studentId,
		from,
		to,
		dueBefore,
	};
	const { data: summary, isLoading: isSummaryLoading } =
		useInvoiceSummary(summaryFilters);
	const statValue = (amount: number) =>
		isSummaryLoading ? '—' : `${formatPrice(amount)} UZS`;

	const hasExtraFilters = studentId != null || !!from || !!to || !!dueBefore;

	function handleStatusChange(value: (typeof INVOICE_STATUS_FILTERS)[number]['value']) {
		void navigate({
			search: (prev) => ({ ...prev, status: value, page: undefined }),
		});
	}

	function handleStudentChange(value: number | undefined) {
		void navigate({
			search: (prev) => ({ ...prev, studentId: value, page: undefined }),
		});
	}

	function handleDateChange(field: 'from' | 'to' | 'dueBefore', value: string) {
		void navigate({
			search: (prev) => ({ ...prev, [field]: value || undefined, page: undefined }),
		});
	}

	function handleClearExtraFilters() {
		void navigate({
			search: (prev) => ({
				...prev,
				studentId: undefined,
				from: undefined,
				to: undefined,
				dueBefore: undefined,
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
				title="Invoices"
				description="Billing and outstanding balances"
				actions={
					<>
						<Can permission="invoice.generate">
							<Button
								variant="outline"
								onClick={() => setGenerateOpen(true)}
							>
								<CalendarClock className="mr-1.5 size-4" />
								Generate monthly invoices
							</Button>
						</Can>
						<Can permission="invoice.create">
							<Button onClick={() => setCreateOpen(true)}>
								<Plus className="mr-1.5 size-4" />
								Create invoice
							</Button>
						</Can>
					</>
				}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard
					label="Total invoiced"
					value={statValue(summary?.totalInvoiced ?? 0)}
				/>
				<StatCard
					label="Collected"
					value={
						<span className="text-tone-green-fg">
							{statValue(summary?.collected ?? 0)}
						</span>
					}
				/>
				<StatCard
					label="Outstanding"
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
						label: f.label,
						active: status === f.value,
						onClick: () => handleStatusChange(f.value),
					}))}
					actions={
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="inline-flex">
									<Button variant="outline" disabled>
										<Download className="mr-1.5 size-4" />
										Export
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>Not available yet</TooltipContent>
						</Tooltip>
					}
				/>

				<div className="flex flex-wrap items-end gap-4">
					<div className="flex flex-col gap-1.5">
						<Label className="text-xs text-muted-foreground">Student</Label>
						<div className="w-56">
							<StudentPicker
								value={studentId}
								onChange={handleStudentChange}
							/>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="invoice-from"
							className="text-xs text-muted-foreground"
						>
							Issued from
						</Label>
						<DatePicker
							id="invoice-from"
							value={from}
							onChange={(value) => handleDateChange('from', value ?? '')}
							className="h-9 w-37.5"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="invoice-to"
							className="text-xs text-muted-foreground"
						>
							Issued to
						</Label>
						<DatePicker
							id="invoice-to"
							value={to}
							onChange={(value) => handleDateChange('to', value ?? '')}
							className="h-9 w-37.5"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="invoice-due-before"
							className="text-xs text-muted-foreground"
						>
							Due before
						</Label>
						<DatePicker
							id="invoice-due-before"
							value={dueBefore}
							onChange={(value) =>
								handleDateChange('dueBefore', value ?? '')
							}
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
						Failed to load invoices. Please refresh.
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
			<GenerateInvoicesDialog open={generateOpen} onOpenChange={setGenerateOpen} />
		</div>
	);
}
