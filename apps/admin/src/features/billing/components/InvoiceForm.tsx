import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';

import {
	Button,
	FieldGroup,
	Form,
	FormControl,
	FormField,
	FormInput,
	FormItem,
	FormLabel,
	FormMessage,
	FormSelect,
	Separator,
	Spinner,
	Textarea,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatPrice } from '@repo/utils';

import { FormSheet } from '@/components/FormSheet';
import { useBranches } from '@/api/branches';
import { useActiveBranchIds } from '@/store/branchStore';

import { blankToNull } from '../schemas/discount-form.schema';
import {
	createInvoiceSchema,
	editInvoiceSchema,
	NO_DISCOUNT_VALUE,
	type CreateInvoiceFormValues,
	type EditInvoiceFormValues,
} from '../schemas/invoice-form.schema';
import type { InvoiceDetail, InvoiceResponse } from '../api/invoices.queries';
import {
	useApplyDiscount,
	useCreateInvoice,
	useUpdateInvoice,
} from '../api/invoices.mutations';
import { useDiscountList } from '../api/discounts.queries';
import { StudentPicker } from './StudentPicker';

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoice: InvoiceResponse;
}

type InvoiceFormProps = CreateProps | EditProps;

function Section({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-col gap-4 rounded-xl bg-white p-4">{children}</div>;
}

function CreateInvoiceForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const activeBranchIds = useActiveBranchIds();
	const form = useForm<CreateInvoiceFormValues>({
		resolver: zodResolver(createInvoiceSchema),
		defaultValues: {
			studentId: undefined as unknown as number,
			branchId:
				activeBranchIds?.length === 1
					? activeBranchIds[0]
					: (undefined as unknown as number),
			dueDate: '',
			lineItems: [
				{
					description: '',
					quantity: 1,
					unitAmount: undefined as unknown as number,
				},
			],
			discountId: NO_DISCOUNT_VALUE,
			notes: '',
		},
	});
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'lineItems',
	});

	const { data: branches = [] } = useBranches();
	const branchOptions = branches.map((b) => ({ value: String(b.id), label: b.name }));

	const { data: discountData } = useDiscountList({ isActive: true, limit: 100 });
	const discounts = discountData?.rows ?? [];
	const discountOptions = [
		{ value: NO_DISCOUNT_VALUE, label: 'No discount' },
		...discounts.map((d) => ({
			value: String(d.id),
			label: `${d.name} (${d.type === 'PERCENTAGE' ? `${d.value}%` : `${formatPrice(d.value)} UZS`})`,
		})),
	];

	const createInvoice = useCreateInvoice();
	const applyDiscount = useApplyDiscount();

	useEffect(() => {
		onPendingChange(createInvoice.isPending || applyDiscount.isPending);
	}, [createInvoice.isPending, applyDiscount.isPending, onPendingChange]);

	const watchedLineItems = form.watch('lineItems');
	const watchedDiscountId = form.watch('discountId');
	const subtotal = watchedLineItems.reduce(
		(sum, li) => sum + (Number(li.quantity) || 0) * (Number(li.unitAmount) || 0),
		0,
	);
	const selectedDiscount = discounts.find((d) => String(d.id) === watchedDiscountId);
	const discountAmount = selectedDiscount
		? selectedDiscount.type === 'PERCENTAGE'
			? (subtotal * selectedDiscount.value) / 100
			: selectedDiscount.value
		: 0;
	const total = Math.max(subtotal - discountAmount, 0);

	async function onSubmit(values: CreateInvoiceFormValues) {
		let invoice: InvoiceDetail;
		try {
			invoice = await createInvoice.mutateAsync({
				branchId: values.branchId,
				studentId: values.studentId,
				dueDate: values.dueDate,
				lineItems: values.lineItems,
				notes: blankToNull(values.notes),
			});
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to create invoice');
			return;
		}

		if (values.discountId !== NO_DISCOUNT_VALUE) {
			try {
				await applyDiscount.mutateAsync({
					invoiceId: invoice.id,
					discountId: Number(values.discountId),
				});
			} catch (err) {
				toast.error(
					`Invoice ${invoice.invoiceNumber} was created, but the discount could not be applied: ${
						isApiError(err) ? err.message : 'unknown error'
					}`,
				);
				onSuccess();
				return;
			}
		}

		toast.success('Invoice created');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-invoice-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section>
					<span className="text-sm font-semibold text-muted-foreground">
						Bill to
					</span>
					<FieldGroup>
						<FormField
							control={form.control}
							name="studentId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Student *</FormLabel>
									<StudentPicker
										value={field.value}
										onChange={field.onChange}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="branchId"
								label="Branch *"
								options={branchOptions}
								valueAsNumber
							/>
							<FormInput
								control={form.control}
								name="dueDate"
								label="Due date *"
								type="date"
							/>
						</div>
					</FieldGroup>
				</Section>

				<Section>
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-muted-foreground">
							Line items
						</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() =>
								append({
									description: '',
									quantity: 1,
									unitAmount: undefined as unknown as number,
								})
							}
						>
							<Plus className="mr-1 size-3.5" />
							Add item
						</Button>
					</div>
					<div className="flex flex-col gap-3">
						{fields.map((field, index) => (
							<div key={field.id} className="flex items-start gap-2">
								<div className="flex-1">
									<FormInput
										control={form.control}
										name={`lineItems.${index}.description`}
										placeholder="Description"
									/>
								</div>
								<div className="w-16">
									<FormInput
										control={form.control}
										name={`lineItems.${index}.quantity`}
										type="number"
										min={1}
										placeholder="Qty"
										onChange={(e) =>
											form.setValue(
												`lineItems.${index}.quantity`,
												e.target.value === ''
													? (undefined as unknown as number)
													: Number(e.target.value),
												{ shouldValidate: true },
											)
										}
									/>
								</div>
								<div className="w-36">
									<FormInput
										control={form.control}
										name={`lineItems.${index}.unitAmount`}
										type="number"
										min={0}
										placeholder="Unit price"
										onChange={(e) =>
											form.setValue(
												`lineItems.${index}.unitAmount`,
												e.target.value === ''
													? (undefined as unknown as number)
													: Number(e.target.value),
												{ shouldValidate: true },
											)
										}
									/>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
									disabled={fields.length === 1}
									onClick={() => remove(index)}
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
						))}
					</div>
					{form.formState.errors.lineItems?.root?.message && (
						<p className="text-sm font-medium text-destructive">
							{form.formState.errors.lineItems.root.message}
						</p>
					)}
				</Section>

				<Section>
					<FormSelect
						control={form.control}
						name="discountId"
						label="Discount"
						options={discountOptions}
					/>
					<div className="flex flex-col gap-1.5">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Subtotal</span>
							<span className="font-medium tabular-nums">
								{formatPrice(subtotal)} UZS
							</span>
						</div>
						{selectedDiscount && (
							<div className="flex justify-between text-sm text-primary">
								<span>{selectedDiscount.name}</span>
								<span className="tabular-nums">
									-{formatPrice(discountAmount)} UZS
								</span>
							</div>
						)}
						<Separator className="my-1" />
						<div className="flex justify-between text-base font-bold">
							<span>Total</span>
							<span className="tabular-nums">{formatPrice(total)} UZS</span>
						</div>
					</div>
				</Section>

				<Section>
					<FormField
						control={form.control}
						name="notes"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Notes</FormLabel>
								<FormControl>
									<Textarea placeholder="Optional notes" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</Section>
			</form>
		</Form>
	);
}

function EditInvoiceForm({
	invoice,
	onSuccess,
	onPendingChange,
}: {
	invoice: InvoiceResponse;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const form = useForm<EditInvoiceFormValues>({
		resolver: zodResolver(editInvoiceSchema),
		defaultValues: {
			dueDate: invoice.dueDate,
			notes: invoice.notes ?? '',
		},
	});

	const updateInvoice = useUpdateInvoice();

	useEffect(() => {
		onPendingChange(updateInvoice.isPending);
	}, [updateInvoice.isPending, onPendingChange]);

	async function onSubmit(values: EditInvoiceFormValues) {
		await updateInvoice.mutateAsync({
			id: invoice.id,
			dueDate: values.dueDate,
			notes: blankToNull(values.notes),
		});
		toast.success('Invoice updated');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-invoice-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="dueDate"
							label="Due date *"
							type="date"
						/>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Optional notes"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FieldGroup>
				</Section>
			</form>
		</Form>
	);
}

export function InvoiceForm(props: InvoiceFormProps) {
	const { open, onOpenChange, mode } = props;
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-invoice-form' : 'edit-invoice-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? 'Create invoice' : 'Edit invoice'}
			description={
				mode === 'create'
					? 'Fields marked * are required'
					: 'Due date and notes can be changed while the invoice is a draft.'
			}
			maxWidth="lg"
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						{mode === 'create' ? 'Create invoice' : 'Save changes'}
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreateInvoiceForm
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			) : (
				<EditInvoiceForm
					invoice={(props as EditProps).invoice}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
