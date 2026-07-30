import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	Skeleton,
} from '@repo/ui';
import { formatMoney } from '@repo/utils';

import { usePaymentInstructions } from '../api/billing.queries';
import type { StudentInvoiceDetail } from '../api/billing.queries';
import { useAppT } from '@/locales';

interface HowToPaySheetProps {
	invoice: StudentInvoiceDetail;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * The "How to pay" bottom sheet per the design. There is no online checkout on this
 * surface (deliberately — see the backend `BillingController` docblock), so this shows
 * the invoice recap and the center's real contact details from
 * `GET /student/billing/payment-instructions`: pay at the reception desk, or arrange a
 * bank transfer with the center referencing the invoice number.
 */
export function HowToPaySheet({ invoice, open, onOpenChange }: HowToPaySheetProps) {
	const t = useAppT('billing');
	const { data, isPending } = usePaymentInstructions(open);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="bottom" className="mx-auto max-h-[92svh] overflow-y-auto rounded-t-[22px] sm:max-w-md sm:rounded-t-2xl">
				<SheetHeader className="pb-0">
					<SheetTitle>{t('howToPay')}</SheetTitle>
					<SheetDescription className="sr-only">
						{t('howToPay')} · {invoice.invoiceNumber}
					</SheetDescription>
				</SheetHeader>

				<div className="px-4 pb-6">
					<div className="rounded-[13px] bg-muted p-3.5 text-center">
						<p className="font-mono text-[11.5px] text-muted-foreground">
							{invoice.invoiceNumber}
						</p>
						<p className="mt-2.5 text-[11.5px] text-muted-foreground">
							{t('balanceDueLabel')}
						</p>
						<p className="mt-0.5 text-[26px] font-extrabold tabular-nums tracking-tight text-foreground">
							{formatMoney(invoice.balance, invoice.currency)}
						</p>
					</div>

					{isPending || !data ? (
						<div className="mt-3.5 flex flex-col gap-2.5">
							<Skeleton className="h-24 w-full rounded-[13px]" />
							<Skeleton className="h-24 w-full rounded-[13px]" />
						</div>
					) : (
						<div className="mt-3.5 flex flex-col gap-2.5">
							<div className="rounded-[13px] border border-border p-3.5">
								<div className="flex items-center gap-2.5">
									<span className="flex size-6.5 shrink-0 items-center justify-center rounded-lg bg-tone-indigo-bg text-xs font-bold text-tone-indigo-fg">
										1
									</span>
									<p className="text-sm font-bold text-foreground">
										{t('payAtReception')}
									</p>
								</div>
								<p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
									{t('payAtReceptionHint')}
								</p>
								<div className="mt-2.5 border-t border-border pt-1.5">
									<InstructionRow
										label={t('branchLabel')}
										value={data.branchName}
									/>
									{data.branchAddress && (
										<InstructionRow
											label={t('addressLabel')}
											value={data.branchAddress}
										/>
									)}
									{data.branchPhone && (
										<InstructionRow
											label={t('phoneLabel')}
											value={data.branchPhone}
										/>
									)}
								</div>
							</div>

							<div className="rounded-[13px] border border-border p-3.5">
								<div className="flex items-center gap-2.5">
									<span className="flex size-6.5 shrink-0 items-center justify-center rounded-lg bg-tone-indigo-bg text-xs font-bold text-tone-indigo-fg">
										2
									</span>
									<p className="text-sm font-bold text-foreground">
										{t('bankTransfer')}
									</p>
								</div>
								<p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
									{t('bankTransferHint', {
										invoiceNumber: invoice.invoiceNumber,
									})}
								</p>
								<div className="mt-2.5 border-t border-border pt-1.5">
									<InstructionRow
										label={t('centerLabel')}
										value={data.centerName}
									/>
									{data.centerPhone && (
										<InstructionRow
											label={t('phoneLabel')}
											value={data.centerPhone}
										/>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}

function InstructionRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between gap-3 py-1.5">
			<span className="text-[11.5px] text-muted-foreground">{label}</span>
			<span className="text-right text-xs font-semibold text-foreground">
				{value}
			</span>
		</div>
	);
}
