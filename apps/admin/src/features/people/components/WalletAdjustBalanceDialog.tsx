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

import { useAdjustWalletBalance } from '../api/wallet.mutations';
import {
	adjustBalanceSchema,
	type AdjustBalanceFormValues,
} from '../schemas/adjust-balance.schema';

interface WalletAdjustBalanceDialogProps {
	studentId: number;
	currentBalance: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WalletAdjustBalanceDialog({
	studentId,
	currentBalance,
	open,
	onOpenChange,
}: WalletAdjustBalanceDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Adjust balance</DialogTitle>
					<DialogDescription>
						A manual correction to the wallet balance. Use a negative amount
						to deduct.
					</DialogDescription>
				</DialogHeader>

				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    form state resets without a reset effect. */}
				{open && (
					<AdjustBalanceForm
						studentId={studentId}
						currentBalance={currentBalance}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function AdjustBalanceForm({
	studentId,
	currentBalance,
	onClose,
}: {
	studentId: number;
	currentBalance: number;
	onClose: () => void;
}) {
	const form = useForm<AdjustBalanceFormValues>({
		resolver: zodResolver(adjustBalanceSchema(currentBalance)),
		defaultValues: { amount: undefined, reason: '' },
	});

	const adjustBalance = useAdjustWalletBalance();

	async function onSubmit(values: AdjustBalanceFormValues) {
		try {
			await adjustBalance.mutateAsync({
				studentId,
				amount: values.amount,
				reason: values.reason,
			});
			toast.success('Balance adjusted');
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to adjust balance');
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
					<span className="text-sm text-muted-foreground">Current balance</span>
					<span className="text-sm font-bold tabular-nums">
						{formatPrice(currentBalance)} UZS
					</span>
				</div>

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
									Positive to add, negative to deduct.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormInput
						control={form.control}
						name="reason"
						label="Reason *"
						placeholder="Why is this adjustment being made?"
					/>
				</FieldGroup>

				<DialogFooter className="mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={adjustBalance.isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={adjustBalance.isPending}>
						{adjustBalance.isPending && <Spinner className="mr-2 size-4" />}
						Confirm adjustment
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
