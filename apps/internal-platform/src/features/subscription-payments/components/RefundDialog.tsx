import { useState } from 'react';
import { Info } from 'lucide-react';

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	MoneyInput,
	Textarea,
} from '@repo/ui';

import { formatPrice } from '@repo/utils';
import type { SubscriptionPaymentView } from '@/api/subscription-payments/types';
import { useAppT } from '@/locales';
import { useT } from '@repo/i18n';

import { useRefundPayment } from '../hooks';

/**
 * Refund a settled payment. The dialog states plainly that this reverses money
 * **only** — it does NOT revoke the granted access period. Amount is optional:
 * empty refunds in full; a partial amount is allowed up to the payment amount.
 */
export function RefundDialog({
	payment,
	open,
	onOpenChange,
}: {
	payment: SubscriptionPaymentView;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const t = useAppT('payments');
	const tc = useT('common');
	const [amount, setAmount] = useState<number | undefined>(undefined);
	const [reason, setReason] = useState('');

	// Fresh state per open is guaranteed by remounting at the call site (keyed on
	// the open flag), so no reset effect is needed here.
	const mutation = useRefundPayment(payment.id, {
		onSuccess: () => onOpenChange(false),
	});

	const overMax = amount != null && amount > payment.amount;
	const invalidAmount = amount != null && (amount <= 0 || overMax);

	function handleSubmit() {
		mutation.mutate({
			amount: amount ?? undefined,
			reason: reason.trim() || undefined,
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle>{t('refund.title')}</DialogTitle>
					<DialogDescription>
						{t('refund.description', {
							amount: formatPrice(payment.amount),
							currency: payment.currency,
						})}
					</DialogDescription>
				</DialogHeader>

				{/* Money-not-access notice — operators must not assume access was pulled. */}
				<div className="flex gap-2.5 rounded-lg border border-tone-blue-fg/30 bg-tone-blue-bg/50 px-3.5 py-3 text-sm text-tone-blue-fg">
					<Info className="mt-0.5 size-4 shrink-0" />
					<p>{t('refund.moneyOnlyNotice')}</p>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="refund-amount">{t('refund.amountLabel')}</Label>
						<MoneyInput
							id="refund-amount"
							value={amount}
							onChange={setAmount}
							suffix={payment.currency}
							placeholder={formatPrice(payment.amount)}
						/>
						<p className="text-xs text-muted-foreground">
							{overMax
								? t('refund.overMax', {
										max: formatPrice(payment.amount),
										currency: payment.currency,
									})
								: t('refund.amountHint', {
										max: formatPrice(payment.amount),
										currency: payment.currency,
									})}
						</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="refund-reason">{t('refund.reasonLabel')}</Label>
						<Textarea
							id="refund-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t('refund.reasonPlaceholder')}
							rows={3}
						/>
					</div>
				</div>

				{mutation.isError && (
					<p className="text-sm text-destructive">
						{mutation.error instanceof Error
							? mutation.error.message
							: t('refund.error')}
					</p>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={mutation.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button
						variant="destructive"
						onClick={handleSubmit}
						disabled={mutation.isPending || invalidAmount}
					>
						{mutation.isPending ? t('refund.submitting') : t('refund.submit')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
