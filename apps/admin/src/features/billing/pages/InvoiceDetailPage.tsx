import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
	ArrowLeft,
	BadgePercent,
	Download,
	Edit,
	Landmark,
	MessageSquareWarning,
	RotateCcw,
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
import { useStatusLabel, useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { Can } from '@/components/Can';
import { useInvoice, type InvoiceDetail } from '../api/invoices.queries';
import { useUpdateInvoice } from '../api/invoices.mutations';
import { ApplyDiscountDialog } from '../components/ApplyDiscountDialog';
import { ApplyWalletCreditDialog } from '../components/ApplyWalletCreditDialog';
import { CreditNotesCard } from '../components/CreditNotesCard';
import { InvoiceForm } from '../components/InvoiceForm';
import { RecordPaymentDialog } from '../components/RecordPaymentDialog';
import {
	RefundPaymentDialog,
	type RefundablePayment,
} from '../components/RefundPaymentDialog';

function DisabledAction({ label, icon }: { label: string; icon: React.ReactNode }) {
	const t = useAppT('billing');
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
			<TooltipContent>{t('invoiceExtra.notAvailableYet')}</TooltipContent>
		</Tooltip>
	);
}

function InvoiceHeader({
	invoice,
	onEdit,
	onIssue,
	onRecordPayment,
	onApplyCredit,
	onApplyDiscount,
	onVoid,
	actionPending,
}: {
	invoice: InvoiceDetail;
	onEdit: () => void;
	onIssue: () => void;
	onRecordPayment: () => void;
	onApplyCredit: () => void;
	onApplyDiscount: () => void;
	onVoid: () => void;
	actionPending: boolean;
}) {
	const tc = useT('common');
	const t = useAppT('billing');
	const statusLabel = useStatusLabel();
	const canRecordPayment =
		invoice.amountDue > 0 && invoice.status !== 'VOID' && invoice.status !== 'DRAFT';
	const canApplyCredit =
		invoice.status === 'UNPAID' ||
		invoice.status === 'PARTIAL' ||
		invoice.status === 'OVERDUE';
	const canApplyDiscount =
		invoice.status === 'DRAFT' ||
		invoice.status === 'UNPAID' ||
		invoice.status === 'PARTIAL' ||
		invoice.status === 'OVERDUE';
	const canVoid = invoice.status !== 'VOID';

	return (
		<Card className="p-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<div className="flex items-center gap-2.5">
						<h1 className="text-lg font-bold">{invoice.invoiceNumber}</h1>
						<StatusBadge kind="invoice" status={invoice.status}>
							{statusLabel('invoice', invoice.status)}
						</StatusBadge>
					</div>
					<div className="mt-1 text-sm text-muted-foreground">
						{invoice.studentName} · {t('invoiceActions.issuedInline')}{' '}
						{formatDate(invoice.issueDate)} · {t('invoiceActions.dueInline')}{' '}
						{formatDate(invoice.dueDate)}
					</div>
				</div>

				<div className="flex gap-6">
					<div className="text-right">
						<div className="text-xs text-muted-foreground">
							{t('invoices.detail.total')}
						</div>
						<div className="text-base font-bold tabular-nums">
							{formatPrice(invoice.total)} UZS
						</div>
					</div>
					<div className="text-right">
						<div className="text-xs text-muted-foreground">
							{t('invoices.detail.paid')}
						</div>
						<div className="text-base font-bold tabular-nums text-tone-green-fg">
							{formatPrice(invoice.amountPaid)} UZS
						</div>
					</div>
					<div className="text-right">
						<div className="text-xs text-muted-foreground">
							{t('invoices.detail.balance')}
						</div>
						<div
							className={
								invoice.amountDue > 0
									? 'text-base font-bold tabular-nums text-tone-red-fg'
									: 'text-base font-bold tabular-nums text-muted-foreground'
							}
						>
							{formatPrice(invoice.amountDue)} UZS
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
								{t('invoices.detail.recordPayment')}
							</Button>
						</Can>
					)}

					{canApplyCredit && (
						<Can permission="wallet.apply">
							<Button variant="outline" onClick={onApplyCredit}>
								<Landmark className="mr-1.5 size-4" />
								{t('misc.applyWalletCredit')}
							</Button>
						</Can>
					)}

					{canApplyDiscount && (
						<Can permission="invoice.discount.apply">
							<Button variant="outline" onClick={onApplyDiscount}>
								<BadgePercent className="mr-1.5 size-4" />
								{t('discounts.apply.confirm')}
							</Button>
						</Can>
					)}

					{invoice.status === 'DRAFT' && (
						<Can permission="invoice.update">
							<Button variant="outline" onClick={onEdit}>
								<Edit className="mr-1.5 size-4" />
								{tc('action.edit')}
							</Button>
							<Button
								variant="outline"
								onClick={onIssue}
								disabled={actionPending}
							>
								{t('misc.issueInvoice')}
							</Button>
						</Can>
					)}

					<DisabledAction
						label={t('invoiceExtra.sendReminder')}
						icon={<MessageSquareWarning className="mr-1.5 size-4" />}
					/>
					<DisabledAction
						label={t('invoiceExtra.downloadPdf')}
						icon={<Download className="mr-1.5 size-4" />}
					/>
				</div>

				<div className="ml-auto flex items-center gap-2">
					{canVoid && (
						<Can permission="invoice.void">
							<Button
								variant="outline"
								onClick={onVoid}
								disabled={actionPending}
								className="border-tone-red-fg/30 font-bold text-tone-red-fg shadow-none"
							>
								{t('misc.void')}
							</Button>
						</Can>
					)}
				</div>
			</div>
		</Card>
	);
}

function LineItemsCard({ invoice }: { invoice: InvoiceDetail }) {
	const t = useAppT('billing');
	const statusLabel = useStatusLabel();
	const { lineItems, discounts, taxAmount } = invoice;

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="border-b border-border px-5 py-3">
				<h2 className="text-sm font-semibold">
					{t('invoices.detail.lineItems')}
				</h2>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t('invoices.detail.description')}</TableHead>
						<TableHead>{t('invoices.form.lineType')}</TableHead>
						<TableHead className="text-right">
							{t('invoices.detail.qty')}
						</TableHead>
						<TableHead className="text-right">
							{t('invoices.detail.unit')}
						</TableHead>
						<TableHead className="text-right">
							{t('invoices.detail.amount')}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{lineItems.map((li) => (
						<TableRow key={li.id}>
							<TableCell>{li.description}</TableCell>
							<TableCell>
								<StatusBadge kind="invoice_line_item" status={li.type}>
									{statusLabel('invoice_line_item', li.type)}
								</StatusBadge>
							</TableCell>
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
							<TableCell colSpan={4} className="text-primary">
								{d.name}
							</TableCell>
							<TableCell className="text-right font-medium tabular-nums text-primary">
								-{formatPrice(d.appliedAmount)} UZS
							</TableCell>
						</TableRow>
					))}
					{taxAmount > 0 && (
						<TableRow>
							<TableCell colSpan={4} className="text-muted-foreground">
								{t('misc.tax')}
							</TableCell>
							<TableCell className="text-right tabular-nums text-muted-foreground">
								{formatPrice(taxAmount)} UZS
							</TableCell>
						</TableRow>
					)}
					<TableRow>
						<TableCell colSpan={4} className="text-base font-bold">
							{t('misc.total')}
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
	const t = useAppT('billing');
	const statusLabel = useStatusLabel();
	const { payments } = invoice;
	const [refundTarget, setRefundTarget] = useState<
		InvoiceDetail['payments'][number] | null
	>(null);

	const refundablePayment: RefundablePayment | null = refundTarget && {
		id: refundTarget.id,
		amount: refundTarget.amount,
		currency: invoice.currency,
		invoiceId: invoice.id,
		studentId: invoice.studentId,
	};

	return (
		<Card className="p-5">
			<h2 className="mb-3 text-sm font-semibold">
				{t('invoiceExtra.paymentHistory')}
			</h2>
			{payments.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					{invoice.amountDue > 0
						? t('invoiceActions.outstandingHint')
						: t('invoices.detail.noPayments')}
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
							<div className="flex items-center gap-2">
								<StatusBadge kind="payment" status={p.status}>
									{statusLabel('payment', p.status)}
								</StatusBadge>
								{p.status === 'SUCCEEDED' && p.method !== 'CREDIT' && (
									<Can permission="payment.refund">
										<Button
											variant="ghost"
											size="sm"
											className="size-8 p-0"
											aria-label={t('payments.refund.title')}
											onClick={() => setRefundTarget(p)}
										>
											<RotateCcw className="size-4" />
										</Button>
									</Can>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			<RefundPaymentDialog
				payment={refundablePayment}
				open={refundablePayment != null}
				onOpenChange={(open) => {
					if (!open) setRefundTarget(null);
				}}
			/>
		</Card>
	);
}

interface InvoiceDetailPageProps {
	invoiceId: number;
}

export function InvoiceDetailPage({ invoiceId }: InvoiceDetailPageProps) {
	const t = useAppT('billing');
	const { data: invoice, isLoading, isError } = useInvoice(invoiceId);

	const [editOpen, setEditOpen] = useState(false);
	const [paymentOpen, setPaymentOpen] = useState(false);
	const [discountOpen, setDiscountOpen] = useState(false);
	const [walletCreditOpen, setWalletCreditOpen] = useState(false);
	const [voidOpen, setVoidOpen] = useState(false);

	const updateInvoice = useUpdateInvoice();

	async function handleIssue() {
		if (!invoice) return;
		try {
			await updateInvoice.mutateAsync({ id: invoice.id, status: 'UNPAID' });
			toast.success(t('invoiceExtra.issued'));
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('invoiceActions.issueFailed'));
		}
	}

	async function handleVoidConfirm() {
		if (!invoice) return;
		try {
			await updateInvoice.mutateAsync({ id: invoice.id, status: 'VOID' });
			toast.success(t('invoiceExtra.voided'));
			setVoidOpen(false);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('invoiceActions.voidFailed'));
		}
	}

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-5">
			<Link
				to="/invoices"
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				{t('invoices.back')}
			</Link>

			{isLoading ? (
				<Skeleton className="h-40 rounded-xl" />
			) : isError || !invoice ? (
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					{t('invoices.notFound')}
				</div>
			) : (
				<>
					<InvoiceHeader
						invoice={invoice}
						onEdit={() => setEditOpen(true)}
						onIssue={() => void handleIssue()}
						onRecordPayment={() => setPaymentOpen(true)}
						onApplyCredit={() => setWalletCreditOpen(true)}
						onApplyDiscount={() => setDiscountOpen(true)}
						onVoid={() => setVoidOpen(true)}
						actionPending={updateInvoice.isPending}
					/>

					<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
						<div className="lg:col-span-2">
							<LineItemsCard invoice={invoice} />
						</div>
						<div className="flex flex-col gap-5">
							<PaymentHistoryCard invoice={invoice} />
							<CreditNotesCard invoice={invoice} />
						</div>
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
					<ApplyDiscountDialog
						invoice={invoice}
						open={discountOpen}
						onOpenChange={setDiscountOpen}
					/>
					<ApplyWalletCreditDialog
						invoice={invoice}
						open={walletCreditOpen}
						onOpenChange={setWalletCreditOpen}
					/>
					<ConfirmDialog
						open={voidOpen}
						onOpenChange={setVoidOpen}
						title={t('invoiceExtra.voidTitle')}
						description={t('invoiceExtra.voidDescription')}
						confirmLabel={t('invoiceExtra.void')}
						variant="destructive"
						loading={updateInvoice.isPending}
						onConfirm={() => void handleVoidConfirm()}
					/>
				</>
			)}
		</div>
	);
}
