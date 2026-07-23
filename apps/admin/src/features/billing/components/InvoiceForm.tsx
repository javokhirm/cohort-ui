import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Copy, Plus, Trash2 } from 'lucide-react';

import {
	Button,
	FieldGroup,
	Form,
	FormControl,
	FormDatePicker,
	FormField,
	FormInput,
	FormItem,
	FormLabel,
	FormMessage,
	FormMoneyInput,
	FormSelect,
	Separator,
	Spinner,
	Textarea,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatPrice, toIsoDate } from '@repo/utils';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { FormSection } from '@/components/FormSection';
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
import { INVOICE_LINE_ITEM_TYPE_OPTIONS } from '../lib/invoice-options';
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

function CreateInvoiceForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('billing');
	const tc = useT('common');
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
					type: 'TUITION',
				},
			],
			discountId: NO_DISCOUNT_VALUE,
			notes: '',
		},
	});
	const { fields, append, insert, remove } = useFieldArray({
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

		toast.success(t('invoices.created'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-invoice-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection>
					<span className="text-sm font-semibold text-muted-foreground">
						{t('misc.billTo')}
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
								label={t('feePlans.field.branch')}
								options={branchOptions}
								valueAsNumber
							/>
							<FormDatePicker
								control={form.control}
								name="dueDate"
								label={t('invoices.form.dueDate')}
								minDate={toIsoDate(new Date())}
							/>
						</div>
					</FieldGroup>
				</FormSection>

				<FormSection>
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-muted-foreground">
							{t('invoices.detail.lineItems')}
						</span>
					</div>
					<div className="flex flex-col gap-3">
						{fields.map((field, index) => {
							return (
								<div
									key={field.id}
									className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3"
								>
									<div className="flex items-center justify-between">
										<span className="text-xs font-medium text-muted-foreground">
											Item {index + 1}
										</span>
										<div className="flex items-center">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-7 text-muted-foreground hover:text-foreground"
												aria-label={t(
													'invoiceExtra.duplicateItem',
												)}
												onClick={() =>
													insert(index + 1, {
														...form.getValues(
															`lineItems.${index}`,
														),
													})
												}
											>
												<Copy className="size-4" />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-7 text-muted-foreground hover:text-destructive"
												aria-label={t('invoiceExtra.removeItem')}
												disabled={fields.length === 1}
												onClick={() => remove(index)}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									</div>
									<FormInput
										control={form.control}
										name={`lineItems.${index}.description`}
										label={t('invoices.form.lineDescription')}
										placeholder={t(
											'invoiceExtra.descriptionPlaceholder',
										)}
									/>
									<div className="grid grid-cols-[1.3fr_0.6fr_1.3fr] gap-2">
										<FormSelect
											control={form.control}
											name={`lineItems.${index}.type`}
											label={t('invoices.form.lineType')}
											options={INVOICE_LINE_ITEM_TYPE_OPTIONS.map(
												(o) => ({
													value: o.value,
													label: t(`lineItemType.${o.value}`),
												}),
											)}
										/>
										<FormInput
											control={form.control}
											name={`lineItems.${index}.quantity`}
											label={t('invoices.form.lineQty')}
											type="number"
											min={1}
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
										<FormMoneyInput
											control={form.control}
											name={`lineItems.${index}.unitAmount`}
											label={t('invoices.form.lineUnit')}
											suffix="UZS"
											placeholder="0"
										/>
									</div>
								</div>
							);
						})}
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="w-full border-dashed"
						onClick={() =>
							append({
								description: '',
								quantity: 1,
								unitAmount: undefined as unknown as number,
								type: 'TUITION',
							})
						}
					>
						<Plus className="mr-1 size-3.5" />
						{t('misc.addItem')}
					</Button>
					{form.formState.errors.lineItems?.root?.message && (
						<p className="text-sm font-medium text-destructive">
							{form.formState.errors.lineItems.root.message}
						</p>
					)}
				</FormSection>

				<FormSection>
					<FormSelect
						control={form.control}
						name="discountId"
						label={t('invoices.detail.discount')}
						options={discountOptions}
					/>
					<div className="flex flex-col gap-1.5">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">
								{t('invoices.detail.subtotal')}
							</span>
							<span className="font-medium tabular-nums">
								{formatPrice(subtotal)} UZS
							</span>
						</div>
						{selectedDiscount && (
							<div className="flex justify-between text-sm text-primary">
								<span>
									{selectedDiscount.name}
									{selectedDiscount.type === 'PERCENTAGE' &&
										` (${selectedDiscount.value}%)`}
								</span>
								<span className="tabular-nums">
									-{formatPrice(discountAmount)} UZS
								</span>
							</div>
						)}
						<Separator className="my-1" />
						<div className="flex justify-between text-base font-bold">
							<span>{t('invoices.detail.total')}</span>
							<span className="tabular-nums">{formatPrice(total)} UZS</span>
						</div>
						{subtotal > 0 && total === 0 && (
							<div className="mt-1 flex items-start gap-1.5 text-xs text-tone-amber-fg">
								<AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
								<span>
									This discount brings the total to 0 UZS — nothing will
									be charged.
								</span>
							</div>
						)}
					</div>
				</FormSection>

				<FormSection>
					<FormField
						control={form.control}
						name="notes"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{tc('action.more')}</FormLabel>
								<FormControl>
									<Textarea
										placeholder={t('discountExtra.notesPlaceholder')}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</FormSection>
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
	const t = useAppT('billing');
	const tc = useT('common');
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
		toast.success(t('invoiceExtra.updated'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-invoice-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection>
					<FieldGroup>
						<FormDatePicker
							control={form.control}
							name="dueDate"
							label={t('invoices.form.dueDate')}
						/>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{tc('action.more')}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t(
												'discountExtra.notesPlaceholder',
											)}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FieldGroup>
				</FormSection>
			</form>
		</Form>
	);
}

export function InvoiceForm(props: InvoiceFormProps) {
	const tc = useT('common');
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
						{tc('action.cancel')}
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
