import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	FieldGroup,
	Form,
	FormInput,
	FormSelect,
	Spinner,
	toast,
} from '@repo/ui';

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

function Section({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-col gap-4 rounded-xl bg-white p-4">{children}</div>;
}

function CreateDiscountForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
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
		toast.success('Discount added');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-discount-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label="Discount name *"
							placeholder="e.g. Sibling discount"
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="type"
								label="Type"
								options={DISCOUNT_TYPE_OPTIONS}
							/>
							<FormInput
								control={form.control}
								name="value"
								label="Value *"
								type="number"
								min={0}
								placeholder="10"
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
							label="Promo code"
							placeholder="SIBLING10 (optional)"
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="validFrom"
								label="Valid from"
								type="date"
							/>
							<FormInput
								control={form.control}
								name="validUntil"
								label="Valid until"
								type="date"
							/>
						</div>
					</FieldGroup>
				</Section>
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
		toast.success('Discount updated');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-discount-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label="Discount name *"
							placeholder="e.g. Sibling discount"
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="type"
								label="Type"
								options={DISCOUNT_TYPE_OPTIONS}
							/>
							<FormInput
								control={form.control}
								name="value"
								label="Value *"
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
							label="Promo code"
							placeholder="SIBLING10 (optional)"
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="validFrom"
								label="Valid from"
								type="date"
							/>
							<FormInput
								control={form.control}
								name="validUntil"
								label="Valid until"
								type="date"
							/>
						</div>
						<FormSelect
							control={form.control}
							name="status"
							label="Status"
							options={DISCOUNT_STATUS_OPTIONS}
						/>
					</FieldGroup>
				</Section>
			</form>
		</Form>
	);
}

export function DiscountForm(props: DiscountFormProps) {
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
			title={mode === 'create' ? 'New discount' : 'Edit discount'}
			description="Fields marked * are required"
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						Save discount
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
