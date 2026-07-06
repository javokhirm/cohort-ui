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
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Deposit to wallet</DialogTitle>
					<DialogDescription>
						Top up the student&apos;s wallet balance.
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
	const form = useForm<DepositFormValues>({
		resolver: zodResolver(depositSchema),
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
			toast.success('Deposit recorded');
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to record deposit');
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
											{opt.label}
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
						label="Notes"
						placeholder="Optional"
					/>
				</FieldGroup>

				<DialogFooter className="mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={deposit.isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={deposit.isPending}>
						{deposit.isPending && <Spinner className="mr-2 size-4" />}
						Confirm deposit
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
