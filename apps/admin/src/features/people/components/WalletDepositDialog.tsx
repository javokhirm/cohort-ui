import { useMemo } from 'react';
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
import { useT } from '@repo/i18n';

import { useAppT } from '@/locales';

import { useDepositToWallet } from '../api/wallet.mutations';
import { WALLET_DEPOSIT_METHOD_OPTIONS } from '../lib/wallet-options';
import { depositSchema, type DepositFormValues } from '../schemas/deposit.schema';

interface WalletDepositDialogProps {
	studentId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WalletDepositDialog({
	studentId,
	open,
	onOpenChange,
}: WalletDepositDialogProps) {
	const t = useAppT('people');

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t('wallet.depositDialog.title')}</DialogTitle>
					<DialogDescription>
						{t('wallet.depositDialog.description')}
					</DialogDescription>
				</DialogHeader>

				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    form state resets without a reset effect. */}
				{open && (
					<DepositForm
						studentId={studentId}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function DepositForm({ studentId, onClose }: { studentId: number; onClose: () => void }) {
	const t = useAppT('people');
	const tc = useT('common');
	const tv = useT('validation');
	const schema = useMemo(() => depositSchema(tv), [tv]);

	const form = useForm<DepositFormValues>({
		resolver: zodResolver(schema),
		defaultValues: { amount: undefined, method: 'CASH', notes: '' },
	});

	const deposit = useDepositToWallet();

	async function onSubmit(values: DepositFormValues) {
		try {
			await deposit.mutateAsync({
				studentId,
				amount: values.amount,
				method: values.method,
				notes: values.notes === '' ? null : values.notes,
			});
			toast.success(t('wallet.depositDialog.success'));
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('wallet.depositDialog.failed'));
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FieldGroup>
					<FormInput
						control={form.control}
						name="amount"
						label={t('wallet.depositDialog.amount')}
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
								<FormLabel>{t('wallet.depositDialog.method')}</FormLabel>
								<div className="grid grid-cols-3 gap-2">
									{WALLET_DEPOSIT_METHOD_OPTIONS.map((opt) => (
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
											{t(`wallet.method.${opt.value}`)}
										</Button>
									))}
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormInput
						control={form.control}
						name="notes"
						label={t('wallet.depositDialog.notes')}
						placeholder={t('wallet.depositDialog.notesPlaceholder')}
					/>
				</FieldGroup>

				<DialogFooter className="mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={deposit.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" disabled={deposit.isPending}>
						{deposit.isPending && <Spinner className="mr-2 size-4" />}
						{t('wallet.depositDialog.confirm')}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
