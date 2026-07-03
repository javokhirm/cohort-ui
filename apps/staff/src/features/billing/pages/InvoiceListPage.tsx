import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Download, Plus } from 'lucide-react';

import {
	Button,
	Card,
	PageHeader,
	Pagination,
	SearchFilterBar,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@repo/ui';

import { Can } from '@/components/Can';
import { useInvoiceList } from '../api/invoices.queries';
import type { InvoiceListFilters } from '../api/keys';
import { INVOICE_STATUS_FILTERS } from '../lib/invoice-options';
import { InvoiceTable } from '../components/InvoiceTable';
import { InvoiceForm } from '../components/InvoiceForm';

const PAGE_SIZE = 20;

export function InvoiceListPage() {
	const navigate = useNavigate();
	const { page = 1, status } = useSearch({ from: '/_authed/invoices' });

	const [createOpen, setCreateOpen] = useState(false);

	const filters: InvoiceListFilters = {
		page,
		limit: PAGE_SIZE,
		status,
	};

	const { data, isLoading, isError } = useInvoiceList(filters);
	const invoices = data?.rows ?? [];
	const total = data?.total ?? 0;

	function handleStatusChange(value: (typeof INVOICE_STATUS_FILTERS)[number]['value']) {
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
				title="Invoices"
				description="Billing and outstanding balances"
				actions={
					<Can permission="invoice.create">
						<Button onClick={() => setCreateOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							Create invoice
						</Button>
					</Can>
				}
			/>

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
		</div>
	);
}
