import { Check, ChevronRight } from 'lucide-react';

import { Card, cn, StatusBadge } from '@repo/ui';
import { formatDate, formatMoney } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import type { StudentInvoice } from '../api/billing.queries';
import { useAppT } from '@/locales';

interface InvoiceCardProps {
	invoice: StudentInvoice;
	onOpen: () => void;
}

/**
 * One invoice in the Billing list per the design: number + issue date over the status
 * badge, then the balance due (or total paid) against the due date. Overdue invoices get
 * a red-tinted border; settled ones a green "Paid in full" line.
 */
export function InvoiceCard({ invoice, onOpen }: InvoiceCardProps) {
	const t = useAppT('billing');
	const statusLabel = useStatusLabel();
	const isOverdue = invoice.status === 'OVERDUE';
	const isSettled = invoice.balance === 0;

	return (
		<Card
			onClick={onOpen}
			className={cn(
				'cursor-pointer gap-0 rounded-[15px] py-0 transition-colors hover:border-primary',
				isOverdue && 'border-tone-red-fg/40',
			)}
		>
			<div className="p-4">
				<div className="flex items-start justify-between gap-2.5">
					<div className="min-w-0">
						<p className="font-mono text-[11.5px] text-muted-foreground">
							{invoice.invoiceNumber}
						</p>
						<p className="mt-0.5 text-[14.5px] font-bold text-foreground">
							{t('issuedOn', { date: formatDate(invoice.issueDate) })}
						</p>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<StatusBadge kind="invoice" status={invoice.status}>
							{statusLabel('invoice', invoice.status)}
						</StatusBadge>
						<ChevronRight className="size-4 text-muted-foreground" />
					</div>
				</div>
				<div className="mt-3.5 flex items-end justify-between gap-2">
					<div>
						<p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
							{isSettled ? t('totalPaid') : t('balanceDueLabel')}
						</p>
						<p
							className={cn(
								'mt-0.5 text-lg font-bold tabular-nums',
								isOverdue
									? 'text-tone-red-fg'
									: isSettled
										? 'text-tone-green-fg'
										: 'text-foreground',
							)}
						>
							{formatMoney(
								isSettled ? invoice.total : invoice.balance,
								invoice.currency,
							)}
						</p>
					</div>
					<div className="text-right">
						<p className="text-[11px] text-muted-foreground">
							{t('dueOn', { date: formatDate(invoice.dueDate) })}
						</p>
						{isSettled && (
							<p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-tone-green-fg">
								<Check className="size-3.5" />
								{t('paidInFull')}
							</p>
						)}
					</div>
				</div>
			</div>
		</Card>
	);
}
