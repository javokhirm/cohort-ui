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
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

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
	const t = useAppT('billing');
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t('creditNotes.issue')}</DialogTitle>
					<DialogDescription>
						{t('creditNoteForm.dialogDescription')}
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
	const t = useAppT('billing');
	const tc = useT('common');
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
			toast.success(t('creditNotes.done'));
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('creditNotes.failed'));
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
								<FormLabel>{t('creditNotes.amount')}</FormLabel>
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
									{t('creditNoteForm.maxCreditable', {
										max: formatPrice(maxAmount),
									})}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormInput
						control={form.control}
						name="reason"
						label={t('creditNotes.reason')}
						placeholder={t('creditNotes.reasonPlaceholder')}
					/>
				</FieldGroup>

				<DialogFooter className="mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={createCreditNote.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" disabled={createCreditNote.isPending}>
						{createCreditNote.isPending && (
							<Spinner className="mr-2 size-4" />
						)}
						{t('creditNotes.issue')}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
