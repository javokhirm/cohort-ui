import { useState } from 'react';
import { Link } from '@tanstack/react-router';

import { Card, CardContent, CardHeader, CardTitle, Separator, Skeleton } from '@repo/ui';

import { formatDate, formatPrice } from '@repo/utils';
import type { SubscriptionInvoiceView } from '@/api/subscription-invoices/types';
import { useAppT } from '@/locales';

import { billingIntervalLabel } from '../constants';
import { useSubscriptionInvoices } from '../hooks';
import { InvoiceDetailSheet } from './InvoiceDetailSheet';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

const PREVIEW_LIMIT = 5;

/**
 * A tenant's period history — the subscription invoices for one center, newest
 * first. Rows are the historical snapshots (`tierName`/`unitPrice` as billed),
 * so they intentionally differ from the live plan after a re-price.
 */
export function TenantInvoiceHistory({ tenantId }: { tenantId: number }) {
	const t = useAppT('invoices');
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const { data, isLoading, isError } = useSubscriptionInvoices({
		tenantId,
		page: 1,
		limit: PREVIEW_LIMIT,
	});
	const invoices = data?.rows ?? [];

	function openDetail(invoice: SubscriptionInvoiceView) {
		setSelectedId(invoice.id);
		setSheetOpen(true);
	}

	return (
		<Card className="gap-0 py-0">
			<CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
				<CardTitle className="text-sm font-semibold">
					{t('periodHistory')}
				</CardTitle>
				{(data?.total ?? 0) > 0 && (
					<Link
						to="/subscription-invoices"
						search={{ tenantId }}
						className="text-xs text-primary underline-offset-4 hover:underline"
					>
						{t('viewAll', { count: data?.total ?? 0 })}
					</Link>
				)}
			</CardHeader>
			<CardContent className="px-0 py-0">
				{isLoading ? (
					<div className="flex flex-col gap-2 p-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				) : isError ? (
					<p className="py-8 text-center text-sm text-destructive">
						{t('loadError')}
					</p>
				) : invoices.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						{t('emptyForTenant')}
					</p>
				) : (
					<ul>
						{invoices.map((invoice, i) => (
							<li key={invoice.id}>
								{i > 0 && <Separator />}
								<button
									type="button"
									onClick={() => openDetail(invoice)}
									className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/40"
								>
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="truncate font-mono text-xs font-medium">
											{invoice.code}
										</span>
										<span className="truncate text-xs text-muted-foreground">
											{invoice.tierName} ·{' '}
											{billingIntervalLabel(
												t,
												invoice.billingInterval,
											)}{' '}
											· {formatDate(invoice.issueDate)}
										</span>
									</div>
									<span className="text-sm font-medium tabular-nums">
										{formatPrice(invoice.amount)} {invoice.currency}
									</span>
									<InvoiceStatusBadge status={invoice.status} />
								</button>
							</li>
						))}
					</ul>
				)}
			</CardContent>

			<InvoiceDetailSheet
				invoiceId={selectedId}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</Card>
	);
}
