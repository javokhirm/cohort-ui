import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';

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
	FormSelect,
	Separator,
	Spinner,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatPrice } from '@repo/utils';

import { useApplyDiscount } from '../api/invoices.mutations';
import type { InvoiceDetail } from '../api/invoices.queries';
import { useDiscountList } from '../api/discounts.queries';
import type { DiscountResponse } from '../api/discounts.queries';
import {
	applyDiscountSchema,
	type ApplyDiscountFormValues,
} from '../schemas/apply-discount.schema';

interface ApplyDiscountDialogProps {
	invoice: InvoiceDetail;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ApplyDiscountDialog({
	invoice,
	open,
	onOpenChange,
}: ApplyDiscountDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Apply discount</DialogTitle>
					<DialogDescription>
						{invoice.invoiceNumber} · {invoice.studentName}
					</DialogDescription>
				</DialogHeader>

				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    form state resets without a reset effect. */}
				{open && (
					<ApplyDiscountForm
						invoice={invoice}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

/** Backend `computeDiscountAmount` (invoice-calculator.service.ts): value against the
 *  subtotal, clamped to `[0, subtotal]` so one discount can't drive a line negative. */
function computeApplied(discount: DiscountResponse, subtotal: number): number {
	const raw =
		discount.type === 'PERCENTAGE'
			? (subtotal * discount.value) / 100
			: discount.value;
	return Math.min(Math.max(raw, 0), Math.max(0, subtotal));
}

function ApplyDiscountForm({
	invoice,
	onClose,
}: {
	invoice: InvoiceDetail;
	onClose: () => void;
}) {
	const { data: discountData, isLoading } = useDiscountList({
		isActive: true,
		limit: 100,
	});

	// Only offer discounts not already on this invoice — the backend rejects a
	// duplicate with `DISCOUNT_ALREADY_APPLIED`.
	const appliedIds = new Set(invoice.discounts.map((d) => d.discountId));
	const available = (discountData?.rows ?? []).filter((d) => !appliedIds.has(d.id));

	const options = available.map((d) => ({
		value: String(d.id),
		label: `${d.name} (${
			d.type === 'PERCENTAGE' ? `${d.value}%` : `${formatPrice(d.value)} UZS`
		})`,
	}));

	const form = useForm<ApplyDiscountFormValues>({
		resolver: zodResolver(applyDiscountSchema),
		defaultValues: { discountId: '' },
	});

	const applyDiscount = useApplyDiscount();

	const watchedId = form.watch('discountId');
	const selected = available.find((d) => String(d.id) === watchedId);

	// Preview the resulting total the way the backend recomputes it: the new
	// discount is summed with any already applied, the combined discount is
	// capped at the subtotal, then tax is folded back in.
	const subtotal = invoice.subtotal;
	const newApplied = selected ? computeApplied(selected, subtotal) : 0;
	const newDiscountTotal = Math.min(invoice.discountAmount + newApplied, subtotal);
	const newTotal = Math.max(subtotal - newDiscountTotal + invoice.taxAmount, 0);
	const reduction = Math.max(invoice.total - newTotal, 0);

	async function onSubmit(values: ApplyDiscountFormValues) {
		try {
			await applyDiscount.mutateAsync({
				invoiceId: invoice.id,
				discountId: Number(values.discountId),
			});
			toast.success('Discount applied');
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to apply discount');
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
				<Spinner className="mr-2 size-4" />
				Loading discounts…
			</div>
		);
	}

	if (options.length === 0) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-sm text-muted-foreground">
					{invoice.discounts.length > 0
						? 'Every active discount is already applied to this invoice.'
						: 'No active discounts are available. Create one under Discounts first.'}
				</p>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Close
					</Button>
				</DialogFooter>
			</div>
		);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FieldGroup>
					<FormSelect
						control={form.control}
						name="discountId"
						label="Discount *"
						placeholder="Select a discount"
						options={options}
					/>
				</FieldGroup>

				<div className="flex flex-col gap-1.5">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Current total</span>
						<span className="font-medium tabular-nums">
							{formatPrice(invoice.total)} UZS
						</span>
					</div>
					{selected && (
						<div className="flex justify-between text-sm text-primary">
							<span>{selected.name}</span>
							<span className="tabular-nums">
								-{formatPrice(reduction)} UZS
							</span>
						</div>
					)}
					<Separator className="my-1" />
					<div className="flex justify-between text-base font-bold">
						<span>New total</span>
						<span className="tabular-nums">{formatPrice(newTotal)} UZS</span>
					</div>
					{selected && invoice.total > 0 && newTotal === 0 && (
						<div className="mt-1 flex items-start gap-1.5 text-xs text-tone-amber-fg">
							<AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
							<span>
								This discount brings the total to 0 UZS — nothing more
								will be owed.
							</span>
						</div>
					)}
				</div>

				<DialogFooter className="mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={applyDiscount.isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={applyDiscount.isPending}>
						{applyDiscount.isPending && <Spinner className="mr-2 size-4" />}
						Apply discount
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
