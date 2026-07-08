import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FieldGroup,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormInput,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Spinner,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatPrice } from '@repo/utils';

import { useCreateCreditNote } from '../api/credit-notes.mutations';
import {
	creditNoteSchema,
	type CreditNoteFormValues,
} from '../schemas/credit-note.schema';

interface IssueCreditNoteDialogProps {
	invoiceId: number;
	maxAmount: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function IssueCreditNoteDialog({
	invoiceId,
	maxAmount,
	open,
	onOpenChange,
}: IssueCreditNoteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Issue credit note</DialogTitle>
					<DialogDescription>
						Reverses part of this invoice&apos;s charges. This can&apos;t be
						undone.
					</DialogDescription>
				</DialogHeader>

				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    form state resets without a reset effect. */}
				{open && (
					<IssueCreditNoteForm
						invoiceId={invoiceId}
						maxAmount={maxAmount}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function IssueCreditNoteForm({
	invoiceId,
	maxAmount,
	onClose,
}: {
	invoiceId: number;
	maxAmount: number;
	onClose: () => void;
}) {
	const form = useForm<CreditNoteFormValues>({
		resolver: zodResolver(creditNoteSchema(maxAmount)),
		defaultValues: { amount: undefined, reason: '' },
	});

	const createCreditNote = useCreateCreditNote();

	async function onSubmit(values: CreditNoteFormValues) {
		try {
			await createCreditNote.mutateAsync({
				invoiceId,
				amount: values.amount,
				reason: values.reason,
			});
			toast.success('Credit note issued');
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to issue credit note');
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FieldGroup>
					<FormField
						control={form.control}
						name="amount"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Amount *</FormLabel>
								<FormControl>
									<Input
										{...field}
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
								</FormControl>
								<FormDescription>
									Up to {formatPrice(maxAmount)} UZS creditable.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormInput
						control={form.control}
						name="reason"
						label="Reason *"
						placeholder="Why is this credit note being issued?"
					/>
				</FieldGroup>

				<DialogFooter className="mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={createCreditNote.isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={createCreditNote.isPending}>
						{createCreditNote.isPending && (
							<Spinner className="mr-2 size-4" />
						)}
						Issue credit note
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
