import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	FieldGroup,
	Form,
	FormDatePicker,
	FormInput,
	FormSelect,
	Spinner,
	toast,
} from '@repo/ui';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';

import {
	blankToNull,
	createDiscountSchema,
	editDiscountSchema,
	type CreateDiscountFormValues,
	type EditDiscountFormValues,
} from '../schemas/discount-form.schema';
import type { DiscountResponse } from '../api/discounts.queries';
import { useCreateDiscount, useUpdateDiscount } from '../api/discounts.mutations';
import { DISCOUNT_STATUS_OPTIONS, DISCOUNT_TYPE_OPTIONS } from '../lib/discount-options';

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	discount: DiscountResponse;
}

type DiscountFormProps = CreateProps | EditProps;

function CreateDiscountForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('billing');
	const form = useForm<CreateDiscountFormValues>({
		resolver: zodResolver(createDiscountSchema),
		defaultValues: {
			name: '',
			type: 'PERCENTAGE',
			code: '',
			validFrom: '',
			validUntil: '',
		},
	});

	const createDiscount = useCreateDiscount();

	useEffect(() => {
		onPendingChange(createDiscount.isPending);
	}, [createDiscount.isPending, onPendingChange]);

	async function onSubmit(values: CreateDiscountFormValues) {
		await createDiscount.mutateAsync({
			name: values.name.trim(),
			type: values.type,
			value: values.value,
			code: blankToNull(values.code),
			validFrom: blankToNull(values.validFrom),
			validUntil: blankToNull(values.validUntil),
		});
		toast.success(t('discountExtra.added'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-discount-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label={t('discounts.field.name')}
							placeholder={t('discounts.field.namePlaceholder')}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="type"
								label={t('invoices.form.lineType')}
								options={DISCOUNT_TYPE_OPTIONS.map((o) => ({
									value: o.value,
									label: t(`discountType.${o.value}`),
								}))}
							/>
							<FormInput
								control={form.control}
								name="value"
								label={t('discounts.field.value')}
								type="number"
								min={0}
								placeholder={t('discountExtra.valuePlaceholder')}
								onChange={(e) =>
									form.setValue(
										'value',
										e.target.value === ''
											? (undefined as unknown as number)
											: Number(e.target.value),
										{ shouldValidate: true },
									)
								}
							/>
						</div>
						<FormInput
							control={form.control}
							name="code"
							label={t('discountExtra.promoCode')}
							placeholder={t('discountExtra.promoCodePlaceholder')}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormDatePicker
								control={form.control}
								name="validFrom"
								label={t('discountExtra.validFrom')}
							/>
							<FormDatePicker
								control={form.control}
								name="validUntil"
								label={t('discountExtra.validUntil')}
							/>
						</div>
					</FieldGroup>
				</FormSection>
			</form>
		</Form>
	);
}

function EditDiscountForm({
	discount,
	onSuccess,
	onPendingChange,
}: {
	discount: DiscountResponse;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('billing');
	const tc = useT('common');
	const toDefaults = (d: DiscountResponse): EditDiscountFormValues => ({
		name: d.name,
		type: d.type,
		value: d.value,
		code: d.code ?? '',
		validFrom: d.validFrom ?? '',
		validUntil: d.validUntil ?? '',
		status: d.isActive ? 'active' : 'inactive',
	});

	const form = useForm<EditDiscountFormValues>({
		resolver: zodResolver(editDiscountSchema),
		defaultValues: toDefaults(discount),
	});

	useEffect(() => {
		form.reset(toDefaults(discount));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [discount]);

	const updateDiscount = useUpdateDiscount();

	useEffect(() => {
		onPendingChange(updateDiscount.isPending);
	}, [updateDiscount.isPending, onPendingChange]);

	async function onSubmit(values: EditDiscountFormValues) {
		await updateDiscount.mutateAsync({
			id: discount.id,
			name: values.name.trim(),
			type: values.type,
			value: values.value,
			code: blankToNull(values.code),
			validFrom: blankToNull(values.validFrom),
			validUntil: blankToNull(values.validUntil),
			isActive: values.status === 'active',
		});
		toast.success(t('discounts.updated'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-discount-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label={t('discounts.field.name')}
							placeholder={t('discounts.field.namePlaceholder')}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="type"
								label={t('invoices.form.lineType')}
								options={DISCOUNT_TYPE_OPTIONS.map((o) => ({
									value: o.value,
									label: t(`discountType.${o.value}`),
								}))}
							/>
							<FormInput
								control={form.control}
								name="value"
								label={t('discounts.field.value')}
								type="number"
								min={0}
								onChange={(e) =>
									form.setValue(
										'value',
										e.target.value === ''
											? (undefined as unknown as number)
											: Number(e.target.value),
										{ shouldValidate: true },
									)
								}
							/>
						</div>
						<FormInput
							control={form.control}
							name="code"
							label={t('discountExtra.promoCode')}
							placeholder={t('discountExtra.promoCodePlaceholder')}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormDatePicker
								control={form.control}
								name="validFrom"
								label={t('discountExtra.validFrom')}
							/>
							<FormDatePicker
								control={form.control}
								name="validUntil"
								label={t('discountExtra.validUntil')}
							/>
						</div>
						<FormSelect
							control={form.control}
							name="status"
							label={t('feePlans.field.status')}
							options={DISCOUNT_STATUS_OPTIONS.map((o) => ({
								value: o.value,
								label: tc(`state.${o.labelKey}`),
							}))}
						/>
					</FieldGroup>
				</FormSection>
			</form>
		</Form>
	);
}

export function DiscountForm(props: DiscountFormProps) {
	const t = useAppT('billing');
	const tc = useT('common');
	const { open, onOpenChange, mode } = props;
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-discount-form' : 'edit-discount-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? t('discounts.add') : t('discounts.edit')}
			description={t('feePlans.requiredHint')}
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						{t('misc.saveDiscount')}
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreateDiscountForm
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			) : (
				<EditDiscountForm
					discount={(props as EditProps).discount}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
