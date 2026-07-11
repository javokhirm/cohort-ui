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
	FormDatePicker,
	FormField,
	FormInput,
	FormItem,
	FormLabel,
	FormMessage,
	Spinner,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatPrice, toIsoDate } from '@repo/utils';

import { useRecordPayment } from '../api/invoices.mutations';
import type { InvoiceDetail } from '../api/invoices.queries';
import { RECORDABLE_PAYMENT_METHOD_OPTIONS } from '../lib/invoice-options';
import {
	recordPaymentSchema,
	type RecordPaymentFormValues,
} from '../schemas/record-payment.schema';

interface RecordPaymentDialogProps {
	invoice: InvoiceDetail;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function RecordPaymentDialog({
	invoice,
	open,
	onOpenChange,
}: RecordPaymentDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Record payment</DialogTitle>
					<DialogDescription>
						{invoice.invoiceNumber} · {invoice.studentName}
					</DialogDescription>
				</DialogHeader>

				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    form state resets without a reset effect. */}
				{open && (
					<RecordPaymentForm
						invoice={invoice}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function RecordPaymentForm({
	invoice,
	onClose,
}: {
	invoice: InvoiceDetail;
	onClose: () => void;
}) {
	const form = useForm<RecordPaymentFormValues>({
		resolver: zodResolver(recordPaymentSchema),
		defaultValues: {
			amount: invoice.amountDue,
			method: 'CASH',
			paidAt: toIsoDate(new Date()),
			notes: '',
		},
	});

	const recordPayment = useRecordPayment();

	async function onSubmit(values: RecordPaymentFormValues) {
		try {
			await recordPayment.mutateAsync({
				invoiceId: invoice.id,
				amount: values.amount,
				method: values.method,
				paidAt: new Date(`${values.paidAt}T00:00:00`).toISOString(),
				notes: values.notes === '' ? null : values.notes,
			});
			toast.success('Payment recorded');
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to record payment');
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
					<span className="text-sm text-muted-foreground">
						Outstanding balance
					</span>
					<span className="text-sm font-bold tabular-nums text-tone-red-fg">
						{formatPrice(invoice.amountDue)} UZS
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
						name="method"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Method *</FormLabel>
								<div className="grid grid-cols-3 gap-2">
									{RECORDABLE_PAYMENT_METHOD_OPTIONS.map((opt) => (
										<Button
											key={opt.value}
											type="button"
											variant="outline"
											className={cn(
												'font-medium',
												field.value === opt.value &&
													'border-primary bg-primary/10 text-primary hover:bg-primary/15',
											)}
											onClick={() => field.onChange(opt.value)}
										>
											{opt.label}
										</Button>
									))}
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-2 gap-3">
						<FormDatePicker
							control={form.control}
							name="paidAt"
							label="Date"
						/>
						<FormInput
							control={form.control}
							name="notes"
							label="Notes"
							placeholder="Optional"
						/>
					</div>
				</FieldGroup>

				<DialogFooter className="mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={recordPayment.isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={recordPayment.isPending}>
						{recordPayment.isPending && <Spinner className="mr-2 size-4" />}
						Confirm payment
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
