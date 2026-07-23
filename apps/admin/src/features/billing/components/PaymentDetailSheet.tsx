import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { FileText, RotateCcw } from 'lucide-react';

import {
	Button,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Skeleton,
	StatusBadge,
} from '@repo/ui';
import { formatDateTime, formatPrice } from '@repo/utils';
import { useAppT } from '@/locales';

import { useBranches } from '@/api/branches';
import { Can } from '@/components/Can';
import { usePayment, type PaymentDetail } from '../api/payments.queries';
import { RefundPaymentDialog } from './RefundPaymentDialog';

function isRefundable(payment: PaymentDetail): boolean {
	return payment.status === 'SUCCEEDED' && payment.method !== 'CREDIT';
}

/** Client-side display id (`PMT-2026-0310`) — no such field exists on the backend. */
function transactionNumber(payment: PaymentDetail): string {
	const year = (payment.paidAt ?? payment.createdAt).slice(0, 4);
	return `PMT-${year}-${String(payment.id).padStart(4, '0')}`;
}

function studentInitials(name: string): string {
	const [first, second] = name.trim().split(/\s+/);
	return `${first?.[0] ?? ''}${second?.[0] ?? ''}`.toUpperCase();
}

interface PaymentDetailSheetProps {
	paymentId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PaymentDetailSheet({
	paymentId,
	open,
	onOpenChange,
}: PaymentDetailSheetProps) {
	const t = useAppT('billing');
	const { data: payment, isLoading } = usePayment(open ? paymentId : null);
	const { data: branches = [] } = useBranches();
	const [refundOpen, setRefundOpen] = useState(false);

	const branchName = payment
		? (branches.find((b) => b.id === payment.branchId)?.name ?? '—')
		: '—';

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
				<SheetHeader className="border-b px-6 py-4">
					<SheetTitle>{t('payments.detailTitle')}</SheetTitle>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto p-6">
					{isLoading || !payment ? (
						<div className="flex flex-col gap-3">
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-40 w-full" />
						</div>
					) : (
						<div className="flex flex-col gap-4">
							<div className="rounded-xl border bg-card p-4">
								<div className="flex items-center gap-3">
									<div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
										{studentInitials(payment.studentName)}
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="truncate text-base font-bold">
												{payment.studentName}
											</span>
											<StatusBadge
												kind="payment"
												status={payment.status}
											/>
										</div>
										<div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
											<span className="font-mono">
												{transactionNumber(payment)}
											</span>
											<span>·</span>
											<span>{branchName}</span>
										</div>
									</div>
								</div>
								<div className="mt-3 border-t pt-3">
									<div className="text-xs text-muted-foreground">
										{t('invoices.detail.amount')}
									</div>
									<div className="text-xl font-bold tabular-nums">
										{formatPrice(payment.amount)} {payment.currency}
									</div>
								</div>
								{isRefundable(payment) && (
									<Can permission="payment.refund">
										<Button
											variant="outline"
											className="mt-3 w-full"
											onClick={() => setRefundOpen(true)}
										>
											<RotateCcw className="mr-1.5 size-4" />
											{t('payments.refund.action')}
										</Button>
									</Can>
								)}
							</div>

							<div className="rounded-xl border bg-card p-4">
								<div className="mb-3 text-[10.5px] font-semibold tracking-widest text-muted-foreground uppercase">
									{t('misc.transaction')}
								</div>
								<div className="flex flex-col gap-3">
									<div>
										<div className="text-xs text-muted-foreground">
											{t('payments.column.method')}
										</div>
										<div className="text-sm font-semibold">
											{t(`paymentMethod.${payment.method}`)}
										</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground">
											Date & time
										</div>
										<div className="text-sm font-semibold">
											{payment.paidAt
												? formatDateTime(payment.paidAt).replace(
														', ',
														' · ',
													)
												: 'Not yet settled'}
										</div>
									</div>
									{payment.providerTxnId && (
										<div>
											<div className="text-xs text-muted-foreground">
												{t('misc.providerTransactionId')}
											</div>
											<div className="font-mono text-sm font-semibold">
												{payment.providerTxnId}
											</div>
										</div>
									)}
									{payment.notes && (
										<div>
											<div className="text-xs text-muted-foreground">
												{t('discountExtra.notesPlaceholder')}
											</div>
											<div className="text-sm font-semibold">
												{payment.notes}
											</div>
										</div>
									)}
								</div>
							</div>

							<div className="rounded-xl border bg-card p-4">
								<div className="mb-3 text-[10.5px] font-semibold tracking-widest text-muted-foreground uppercase">
									{t('misc.linkedInvoice')}
								</div>
								{payment.invoiceId != null ? (
									<>
										<div className="flex items-center gap-3">
											<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
												<FileText className="size-4" />
											</div>
											<div>
												<div className="text-sm font-semibold">
													{payment.invoiceNumber ??
														`#${payment.invoiceId}`}
												</div>
												<div className="text-xs text-muted-foreground">
													{t('misc.invoiceReference')}
												</div>
											</div>
										</div>
										<Button
											asChild
											variant="outline"
											className="mt-3 w-full"
										>
											<Link
												to="/invoices/$id"
												params={{ id: String(payment.invoiceId) }}
											>
												<FileText className="mr-1.5 size-4" />
												{t('misc.viewInvoice')}
											</Link>
										</Button>
									</>
								) : (
									<p className="text-sm text-muted-foreground">
										Not linked to an invoice.
									</p>
								)}
							</div>
						</div>
					)}
				</div>

				{payment && (
					<RefundPaymentDialog
						payment={{
							id: payment.id,
							amount: payment.amount,
							currency: payment.currency,
							invoiceId: payment.invoiceId,
							studentId: payment.studentId,
						}}
						open={refundOpen}
						onOpenChange={setRefundOpen}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}
