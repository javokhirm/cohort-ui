import { Link } from '@tanstack/react-router';
import { CheckCircle2 } from 'lucide-react';

import { EmptyState, Separator } from '@repo/ui';
import { formatDate, formatPriceCompact } from '@repo/utils';

import { useInvoiceList } from '@/features/billing/api/invoices.queries';

import { PanelSkeleton } from './DashboardSkeletons';
import { PanelCard } from './PanelCard';
import { PanelError } from './PanelError';
import { useAppT } from '@/locales';

/** Whole days a due date is past, in the local clock. Never negative. */
function daysOverdue(dueDate: string): number {
	const due = new Date(`${dueDate}T00:00:00`);
	const now = new Date();
	return Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86_400_000));
}

/**
 * Overdue invoices, most-overdue first — reuses the invoice list endpoint with
 * `status=OVERDUE&sort=dueDate&order=asc`.
 */
export function OverdueInvoicesCard() {
	const t = useAppT('dashboard');
	const { data, isLoading, isError, refetch } = useInvoiceList({
		status: 'OVERDUE',
		sort: 'dueDate',
		order: 'asc',
		limit: 5,
	});

	if (isLoading) return <PanelSkeleton />;
	if (isError || !data)
		return <PanelError title={t('card.overdueInvoices')} onRetry={refetch} />;

	return (
		<PanelCard
			title={t('card.overdueInvoices')}
			flush
			headerRight={
				<Link
					to="/invoices"
					className="text-sm font-medium text-primary hover:underline"
				>
					{t('viewAll')}
				</Link>
			}
		>
			{data.rows.length === 0 ? (
				<EmptyState
					icon={<CheckCircle2 />}
					title={t('card.nothingOverdueTitle')}
					description={t('card.nothingOverdueDescription')}
				/>
			) : (
				<ul>
					{data.rows.map((invoice, i) => {
						const days = daysOverdue(invoice.dueDate);
						return (
							<li key={invoice.id}>
								{i > 0 && <Separator />}
								<div className="flex items-center gap-4 px-5 py-3">
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{invoice.studentName}
										</p>
										<p className="truncate text-xs text-muted-foreground">
											{invoice.invoiceNumber} · Due{' '}
											{formatDate(invoice.dueDate)}
										</p>
									</div>
									<div className="shrink-0 text-right">
										<p className="text-sm font-semibold tabular-nums text-tone-red-fg">
											{formatPriceCompact(invoice.amountDue)}
										</p>
										<p className="text-xs text-muted-foreground">
											{days} {days === 1 ? 'day' : 'days'}
										</p>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</PanelCard>
	);
}
