import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
	ArrowLeft,
	Ban,
	Download,
	Edit,
	MessageSquareWarning,
	RefreshCcw,
	Wallet,
} from 'lucide-react';

import {
	Button,
	Card,
	ConfirmDialog,
	Separator,
	Skeleton,
	StatusBadge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatDate, formatPrice } from '@repo/utils';

import { Can } from '@/components/Can';
import { useInvoice, type InvoiceDetail } from '../api/invoices.queries';
import { useUpdateInvoice } from '../api/invoices.mutations';
import { InvoiceForm } from '../components/InvoiceForm';
import { RecordPaymentDialog } from '../components/RecordPaymentDialog';

function DisabledAction({ label, icon }: { label: string; icon: React.ReactNode }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex">
					<Button variant="outline" disabled>
						{icon}
						{label}
					</Button>
				</span>
			</TooltipTrigger>
			<TooltipContent>Not available yet</TooltipContent>
		</Tooltip>
	);
}

function InvoiceHeader({
	invoice,
	onEdit,
	onIssue,
	onRecordPayment,
	onVoid,
	actionPending,
}: {
	invoice: InvoiceDetail;
	onEdit: () => void;
	onIssue: () => void;
	onRecordPayment: () => void;
	onVoid: () => void;
	actionPending: boolean;
}) {
	const canRecordPayment =
		invoice.amountDue > 0 && invoice.status !== 'VOID' && invoice.status !== 'DRAFT';
	const canVoid = invoice.status !== 'VOID' && invoice.status !== 'REFUNDED';

	return (
		<Card className="p-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<div className="flex items-center gap-2.5">
						<h1 className="text-lg font-bold">{invoice.invoiceNumber}</h1>
						<StatusBadge kind="invoice" status={invoice.status} />
					</div>
					<div className="mt-1 text-sm text-muted-foreground">
						{invoice.studentName} · Issued {formatDate(invoice.issueDate)} ·
						Due {formatDate(invoice.dueDate)}
					</div>
				</div>

				<div className="flex gap-6">
					<div className="text-right">
						<div className="text-xs text-muted-foreground">Total</div>
						<div className="text-base font-bold tabular-nums">
							{formatPrice(invoice.total)} UZS
						</div>
					</div>
					<div className="text-right">
						<div className="text-xs text-muted-foreground">Paid</div>
						<div className="text-base font-bold tabular-nums text-tone-green-fg">
							{formatPrice(invoice.amountPaid)} UZS
						</div>
					</div>
				</div>
			</div>

			<Separator className="my-4" />

			<div className="flex flex-wrap items-center gap-2">
				<div className="flex flex-wrap items-center gap-2">
					{canRecordPayment && (
						<Can permission="payment.record">
							<Button onClick={onRecordPayment}>
								<Wallet className="mr-1.5 size-4" />
								Record payment
							</Button>
						</Can>
					)}

					{invoice.status === 'DRAFT' && (
						<Can permission="invoice.update">
							<Button variant="outline" onClick={onEdit}>
								<Edit className="mr-1.5 size-4" />
								Edit
							</Button>
							<Button
								variant="outline"
								onClick={onIssue}
								disabled={actionPending}
							>
								Issue invoice
							</Button>
						</Can>
					)}

					<DisabledAction
						label="Send reminder"
						icon={<MessageSquareWarning className="mr-1.5 size-4" />}
					/>
					<DisabledAction
						label="Download PDF"
						icon={<Download className="mr-1.5 size-4" />}
					/>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<DisabledAction
						label="Refund"
						icon={<RefreshCcw className="mr-1.5 size-4" />}
					/>
					{canVoid && (
						<Can permission="invoice.void">
							<Button
								variant="destructive"
								onClick={onVoid}
								disabled={actionPending}
							>
								<Ban className="mr-1.5 size-4" />
								Void
							</Button>
						</Can>
					)}
				</div>
			</div>
		</Card>
	);
}

function LineItemsCard({ invoice }: { invoice: InvoiceDetail }) {
	const { lineItems, discounts, taxAmount } = invoice;

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="border-b border-border px-5 py-3">
				<h2 className="text-sm font-semibold">Line items</h2>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Description</TableHead>
						<TableHead className="text-right">Qty</TableHead>
						<TableHead className="text-right">Unit</TableHead>
						<TableHead className="text-right">Amount</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{lineItems.map((li) => (
						<TableRow key={li.id}>
							<TableCell>{li.description}</TableCell>
							<TableCell className="text-right tabular-nums text-muted-foreground">
								{li.quantity}
							</TableCell>
							<TableCell className="text-right tabular-nums text-muted-foreground">
								{formatPrice(li.unitAmount)} UZS
							</TableCell>
							<TableCell className="text-right font-medium tabular-nums">
								{formatPrice(li.amount)} UZS
							</TableCell>
						</TableRow>
					))}
					{discounts.map((d) => (
						<TableRow key={`discount-${d.id}`}>
							<TableCell colSpan={3} className="text-primary">
								{d.name}
							</TableCell>
							<TableCell className="text-right font-medium tabular-nums text-primary">
								-{formatPrice(d.appliedAmount)} UZS
							</TableCell>
						</TableRow>
					))}
					{taxAmount > 0 && (
						<TableRow>
							<TableCell colSpan={3} className="text-muted-foreground">
								Tax
							</TableCell>
							<TableCell className="text-right tabular-nums text-muted-foreground">
								{formatPrice(taxAmount)} UZS
							</TableCell>
						</TableRow>
					)}
					<TableRow>
						<TableCell colSpan={3} className="text-base font-bold">
							Total
						</TableCell>
						<TableCell className="text-right text-base font-bold tabular-nums">
							{formatPrice(invoice.total)} UZS
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</Card>
	);
}

function PaymentHistoryCard({ invoice }: { invoice: InvoiceDetail }) {
	const { payments } = invoice;

	return (
		<Card className="p-5">
			<h2 className="mb-3 text-sm font-semibold">Payment history</h2>
			{payments.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					{invoice.amountDue > 0
						? 'Outstanding balance — record a payment to update.'
						: 'No payments recorded.'}
				</p>
			) : (
				<div className="flex flex-col gap-3">
					{payments.map((p) => (
						<div
							key={p.id}
							className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
						>
							<div>
								<div className="text-sm font-medium tabular-nums">
									{formatPrice(p.amount)} UZS
								</div>
								<div className="text-xs text-muted-foreground">
									{p.paidAt ? formatDate(p.paidAt) : '—'} · {p.method}
								</div>
							</div>
							<StatusBadge kind="payment" status={p.status} />
						</div>
					))}
				</div>
			)}
		</Card>
	);
}

interface InvoiceDetailPageProps {
	invoiceId: number;
}

export function InvoiceDetailPage({ invoiceId }: InvoiceDetailPageProps) {
	const { data: invoice, isLoading, isError } = useInvoice(invoiceId);

	const [editOpen, setEditOpen] = useState(false);
	const [paymentOpen, setPaymentOpen] = useState(false);
	const [voidOpen, setVoidOpen] = useState(false);

	const updateInvoice = useUpdateInvoice();

	async function handleIssue() {
		if (!invoice) return;
		try {
			await updateInvoice.mutateAsync({ id: invoice.id, status: 'UNPAID' });
			toast.success('Invoice issued');
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to issue invoice');
		}
	}

	async function handleVoidConfirm() {
		if (!invoice) return;
		try {
			await updateInvoice.mutateAsync({ id: invoice.id, status: 'VOID' });
			toast.success('Invoice voided');
			setVoidOpen(false);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to void invoice');
		}
	}

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-5">
			<Link
				to="/invoices"
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Back to invoices
			</Link>

			{isLoading ? (
				<Skeleton className="h-40 rounded-xl" />
			) : isError || !invoice ? (
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					Invoice not found.
				</div>
			) : (
				<>
					<InvoiceHeader
						invoice={invoice}
						onEdit={() => setEditOpen(true)}
						onIssue={() => void handleIssue()}
						onRecordPayment={() => setPaymentOpen(true)}
						onVoid={() => setVoidOpen(true)}
						actionPending={updateInvoice.isPending}
					/>

					<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
						<div className="lg:col-span-2">
							<LineItemsCard invoice={invoice} />
						</div>
						<PaymentHistoryCard invoice={invoice} />
					</div>

					<InvoiceForm
						mode="edit"
						invoice={invoice}
						open={editOpen}
						onOpenChange={setEditOpen}
					/>
					<RecordPaymentDialog
						invoice={invoice}
						open={paymentOpen}
						onOpenChange={setPaymentOpen}
					/>
					<ConfirmDialog
						open={voidOpen}
						onOpenChange={setVoidOpen}
						title="Void this invoice?"
						description="Voiding is irreversible. Payments already recorded on this invoice are not automatically refunded."
						confirmLabel="Void invoice"
						variant="destructive"
						loading={updateInvoice.isPending}
						onConfirm={() => void handleVoidConfirm()}
					/>
				</>
			)}
		</div>
	);
}
