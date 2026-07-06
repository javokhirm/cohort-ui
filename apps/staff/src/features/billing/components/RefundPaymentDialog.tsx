import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FieldGroup,
	Form,
	FormField,
	FormInput,
	FormItem,
	FormLabel,
	FormMessage,
	Spinner,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatPrice } from '@repo/utils';

import { useRefundPayment } from '../api/payments.mutations';
import {
	refundPaymentSchema,
	type RefundPaymentFormValues,
} from '../schemas/refund-payment.schema';

/** The minimal shape needed to refund a payment, regardless of which screen it's rendered from. */
export interface RefundablePayment {
	id: number;
	amount: number;
	currency: string;
	/** `null` for a pure wallet-deposit payment — refundable only as `CASH_OUT`. */
	invoiceId: number | null;
	studentId: number;
}

interface RefundPaymentDialogProps {
	payment: RefundablePayment | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const DESTINATION_OPTIONS: { value: 'WALLET' | 'CASH_OUT'; label: string }[] = [
	{ value: 'WALLET', label: 'Wallet' },
	{ value: 'CASH_OUT', label: 'Cash out' },
];

export function RefundPaymentDialog({
	payment,
	open,
	onOpenChange,
}: RefundPaymentDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Refund payment</DialogTitle>
					<DialogDescription>This can&apos;t be undone.</DialogDescription>
				</DialogHeader>

				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    form state resets without a reset effect. */}
				{open && payment && (
					<RefundPaymentForm
						payment={payment}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function RefundPaymentForm({
	payment,
	onClose,
}: {
	payment: RefundablePayment;
	onClose: () => void;
}) {
	const canUseWallet = payment.invoiceId != null;

	const form = useForm<RefundPaymentFormValues>({
		resolver: zodResolver(refundPaymentSchema),
		defaultValues: {
			amount: payment.amount,
			destination: 'CASH_OUT',
			notes: '',
		},
	});

	const refundPayment = useRefundPayment();

	async function onSubmit(values: RefundPaymentFormValues) {
		try {
			await refundPayment.mutateAsync({
				paymentId: payment.id,
				amount: values.amount,
				destination: values.destination,
				notes: values.notes === '' ? null : values.notes,
				invoiceId: payment.invoiceId,
				studentId: payment.studentId,
			});
			toast.success('Payment refunded');
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to refund payment');
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
					<span className="text-sm text-muted-foreground">Original amount</span>
					<span className="text-sm font-bold tabular-nums">
						{formatPrice(payment.amount)} {payment.currency}
					</span>
				</div>

				<FieldGroup>
					<FormInput
						control={form.control}
						name="amount"
						label="Amount *"
						type="number"
						min={1}
						onChange={(e) =>
							form.setValue(
								'amount',
								e.target.value === ''
									? (undefined as unknown as number)
									: Number(e.target.value),
								{ shouldValidate: true },
							)
						}
					/>

					<FormField
						control={form.control}
						name="destination"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Destination *</FormLabel>
								<div className="grid grid-cols-2 gap-2">
									{DESTINATION_OPTIONS.map((opt) => {
										const disabled =
											opt.value === 'WALLET' && !canUseWallet;
										return (
											<Button
												key={opt.value}
												type="button"
												variant="outline"
												disabled={disabled}
												className={cn(
													'font-medium',
													field.value === opt.value &&
														'border-primary bg-primary/10 text-primary hover:bg-primary/15',
												)}
												onClick={() => field.onChange(opt.value)}
											>
												{opt.label}
											</Button>
										);
									})}
								</div>
								{!canUseWallet && (
									<p className="text-xs text-muted-foreground">
										This payment isn&apos;t linked to an invoice, so
										it can only be refunded as cash.
									</p>
								)}
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormInput
						control={form.control}
						name="notes"
						label="Notes"
						placeholder="Optional"
					/>
				</FieldGroup>

				<DialogFooter className="mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={refundPayment.isPending}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="destructive"
						disabled={refundPayment.isPending}
					>
						{refundPayment.isPending && <Spinner className="mr-2 size-4" />}
						Confirm refund
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
