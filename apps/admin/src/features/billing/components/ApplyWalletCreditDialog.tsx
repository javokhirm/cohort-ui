import { AlertTriangle } from 'lucide-react';

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Separator,
	Spinner,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatPrice } from '@repo/utils';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { useStudentWallet } from '@/features/people/api/wallet.queries';
import { useApplyWalletCredit } from '../api/invoices.mutations';
import type { InvoiceDetail } from '../api/invoices.queries';

interface ApplyWalletCreditDialogProps {
	invoice: InvoiceDetail;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Confirms spending a student's wallet credit against an invoice. Issuing an
 * invoice deliberately no longer touches the wallet server-side, so this is the
 * only path that spends it — and the resulting `CREDIT` payment cannot be
 * refunded, so the amount is previewed before it is committed.
 */
export function ApplyWalletCreditDialog({
	invoice,
	open,
	onOpenChange,
}: ApplyWalletCreditDialogProps) {
	const t = useAppT('billing');
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t('applyWallet.title')}</DialogTitle>
					<DialogDescription>
						{invoice.invoiceNumber} · {invoice.studentName}
					</DialogDescription>
				</DialogHeader>

				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    balance is re-fetched rather than shown from a stale render. */}
				{open && (
					<ApplyWalletCreditBody
						invoice={invoice}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function ApplyWalletCreditBody({
	invoice,
	onClose,
}: {
	invoice: InvoiceDetail;
	onClose: () => void;
}) {
	const t = useAppT('billing');
	const tc = useT('common');
	const { data: wallet, isLoading, isError } = useStudentWallet(invoice.studentId);
	const applyWalletCredit = useApplyWalletCredit();

	async function handleConfirm() {
		try {
			const result = await applyWalletCredit.mutateAsync(invoice.id);
			toast.success(
				result.applied > 0
					? t('invoiceActions.walletApplied', {
							amount: formatPrice(result.applied),
						})
					: t('invoiceActions.noWalletCredit'),
			);
			onClose();
		} catch (err) {
			toast.error(
				isApiError(err) ? err.message : t('invoiceActions.applyWalletFailed'),
			);
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
				<Spinner className="mr-2 size-4" />
				{tc('state.loading')}
			</div>
		);
	}

	if (isError || !wallet) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-sm text-muted-foreground">
					{t('applyWallet.loadFailed')}
				</p>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						{t('misc.close')}
					</Button>
				</DialogFooter>
			</div>
		);
	}

	// Mirrors the backend (`WalletService.applyCreditToInvoice`): it settles
	// `min(balance, amountDue)`, so a preview computed any other way would lie.
	const willApply = Math.min(wallet.balance, Math.max(invoice.amountDue, 0));
	const remaining = wallet.balance - willApply;

	if (willApply <= 0) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-sm text-muted-foreground">
					{t('applyWallet.emptyWallet')}
				</p>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						{t('misc.close')}
					</Button>
				</DialogFooter>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">
						{t('applyWallet.walletBalance')}
					</span>
					<span className="font-medium tabular-nums">
						{formatPrice(wallet.balance)} {wallet.currency}
					</span>
				</div>
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">
						{t('applyWallet.amountDue')}
					</span>
					<span className="font-medium tabular-nums">
						{formatPrice(invoice.amountDue)} {invoice.currency}
					</span>
				</div>
				<Separator className="my-1" />
				<div className="flex justify-between text-base font-bold">
					<span>{t('applyWallet.willApply')}</span>
					<span className="tabular-nums">
						{formatPrice(willApply)} {invoice.currency}
					</span>
				</div>
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">
						{t('applyWallet.remaining')}
					</span>
					<span className="tabular-nums text-muted-foreground">
						{formatPrice(remaining)} {wallet.currency}
					</span>
				</div>
			</div>

			<div className="flex items-start gap-1.5 text-xs text-tone-amber-fg">
				<AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
				<span>{t('applyWallet.cannotUndo')}</span>
			</div>

			<DialogFooter className="mt-2">
				<Button
					type="button"
					variant="outline"
					onClick={onClose}
					disabled={applyWalletCredit.isPending}
				>
					{tc('action.cancel')}
				</Button>
				<Button
					type="button"
					onClick={() => void handleConfirm()}
					disabled={applyWalletCredit.isPending}
				>
					{applyWalletCredit.isPending && <Spinner className="mr-2 size-4" />}
					{t('misc.applyWalletCredit')}
				</Button>
			</DialogFooter>
		</div>
	);
}
