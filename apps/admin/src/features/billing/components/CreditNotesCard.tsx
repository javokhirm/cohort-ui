import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button, Card, Skeleton } from '@repo/ui';
import { formatDate, formatPrice } from '@repo/utils';
import { useAppT } from '@/locales';

import { Can } from '@/components/Can';
import { useCreditNotes } from '../api/credit-notes.queries';
import type { InvoiceDetail } from '../api/invoices.queries';
import { computeCreditableAmount } from '../lib/credit-notes';
import { IssueCreditNoteDialog } from './IssueCreditNoteDialog';

interface CreditNotesCardProps {
	invoice: InvoiceDetail;
}

export function CreditNotesCard({ invoice }: CreditNotesCardProps) {
	const t = useAppT('billing');
	const { data: creditNotes = [], isLoading } = useCreditNotes(invoice.id);
	const [issueOpen, setIssueOpen] = useState(false);

	const maxAmount = computeCreditableAmount(invoice.lineItems, creditNotes);
	const canIssue =
		invoice.status !== 'DRAFT' && invoice.status !== 'VOID' && maxAmount > 0;

	return (
		<Card className="p-5">
			<div className="mb-3 flex items-center justify-between">
				<h2 className="text-sm font-semibold">
					{t('invoices.detail.creditNotes')}
				</h2>
				{canIssue && (
					<Can permission="credit-note.create">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIssueOpen(true)}
						>
							<Plus className="mr-1.5 size-3.5" />
							{t('creditNotes.issue')}
						</Button>
					</Can>
				)}
			</div>

			{isLoading ? (
				<Skeleton className="h-16 rounded-lg" />
			) : creditNotes.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					{t('invoiceExtra.noCreditNotesIssued')}
				</p>
			) : (
				<div className="flex flex-col gap-3">
					{creditNotes.map((cn) => (
						<div
							key={cn.id}
							className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
						>
							<div>
								<div className="font-mono text-xs font-semibold">
									{cn.creditNoteNumber}
								</div>
								<div className="mt-0.5 text-xs text-muted-foreground">
									{formatDate(cn.createdAt)} · {cn.reason}
								</div>
							</div>
							<div className="text-sm font-medium tabular-nums text-primary">
								-{formatPrice(cn.amount)} UZS
							</div>
						</div>
					))}
				</div>
			)}

			<IssueCreditNoteDialog
				invoiceId={invoice.id}
				maxAmount={maxAmount}
				open={issueOpen}
				onOpenChange={setIssueOpen}
			/>
		</Card>
	);
}
