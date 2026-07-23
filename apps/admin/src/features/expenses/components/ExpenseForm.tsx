import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
	FormSelect,
	Spinner,
	Textarea,
	toast,
} from '@repo/ui';
import { toIsoDate } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { BranchSelectField } from '@/components/BranchSelectField';
import { useAppT } from '@/locales';
import { useActiveBranchIds } from '@/store/branchStore';

import {
	blankToNull,
	expenseFormSchema,
	type ExpenseFormValues,
} from '../schemas/expense-form.schema';
import type { ExpenseResponse } from '../api/expenses.queries';
import { useCreateExpense, useUpdateExpense } from '../api/expenses.mutations';
import { EXPENSE_CATEGORY_OPTIONS } from '../lib/expense-options';

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	expense: ExpenseResponse;
}

type ExpenseFormProps = CreateProps | EditProps;

function CreateExpenseForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('expenses');
	const tv = useT('validation');
	const statusLabel = useStatusLabel();
	const schema = useMemo(() => expenseFormSchema(tv), [tv]);

	const activeBranchIds = useActiveBranchIds();
	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			category: 'RENT',
			branchId:
				activeBranchIds?.length === 1
					? activeBranchIds[0]
					: (undefined as unknown as number),
			amount: undefined as unknown as number,
			expenseDate: toIsoDate(new Date()),
			vendor: '',
			description: '',
		},
	});

	const createExpense = useCreateExpense();

	useEffect(() => {
		onPendingChange(createExpense.isPending);
	}, [createExpense.isPending, onPendingChange]);

	async function onSubmit(values: ExpenseFormValues) {
		await createExpense.mutateAsync({
			branchId: values.branchId,
			category: values.category,
			amount: values.amount,
			expenseDate: values.expenseDate,
			vendor: blankToNull(values.vendor),
			description: blankToNull(values.description),
		});
		toast.success(t('created'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-expense-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="category"
								label={t('field.category')}
								options={EXPENSE_CATEGORY_OPTIONS.map((o) => ({
									value: o.value,
									label: statusLabel('expense', o.value),
								}))}
							/>
							<BranchSelectField
								control={form.control}
								name="branchId"
								label={t('field.branch')}
								valueAsNumber
							/>
						</div>
						<FormInput
							control={form.control}
							name="amount"
							label={t('field.amount')}
							type="number"
							min={0}
							placeholder={t('field.amountPlaceholder')}
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
						<div className="grid grid-cols-2 gap-3">
							<FormDatePicker
								control={form.control}
								name="expenseDate"
								label={t('field.date')}
							/>
							<FormInput
								control={form.control}
								name="vendor"
								label={t('field.vendor')}
								placeholder={t('field.vendorPlaceholder')}
							/>
						</div>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('field.description')}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t(
												'field.descriptionPlaceholder',
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

function EditExpenseForm({
	expense,
	onSuccess,
	onPendingChange,
}: {
	expense: ExpenseResponse;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const toDefaults = (e: ExpenseResponse): ExpenseFormValues => ({
		category: e.category,
		branchId: e.branchId,
		amount: e.amount,
		expenseDate: e.expenseDate,
		vendor: e.vendor ?? '',
		description: e.description ?? '',
	});

	const t = useAppT('expenses');
	const tv = useT('validation');
	const statusLabel = useStatusLabel();
	const schema = useMemo(() => expenseFormSchema(tv), [tv]);

	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(schema),
		defaultValues: toDefaults(expense),
	});

	useEffect(() => {
		form.reset(toDefaults(expense));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [expense]);

	const updateExpense = useUpdateExpense();

	useEffect(() => {
		onPendingChange(updateExpense.isPending);
	}, [updateExpense.isPending, onPendingChange]);

	async function onSubmit(values: ExpenseFormValues) {
		await updateExpense.mutateAsync({
			id: expense.id,
			branchId: values.branchId,
			category: values.category,
			amount: values.amount,
			expenseDate: values.expenseDate,
			vendor: blankToNull(values.vendor),
			description: blankToNull(values.description),
		});
		toast.success(t('updated'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-expense-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="category"
								label={t('field.category')}
								options={EXPENSE_CATEGORY_OPTIONS.map((o) => ({
									value: o.value,
									label: statusLabel('expense', o.value),
								}))}
							/>
							<BranchSelectField
								control={form.control}
								name="branchId"
								label={t('field.branch')}
								valueAsNumber
							/>
						</div>
						<FormInput
							control={form.control}
							name="amount"
							label={t('field.amount')}
							type="number"
							min={0}
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
						<div className="grid grid-cols-2 gap-3">
							<FormDatePicker
								control={form.control}
								name="expenseDate"
								label={t('field.date')}
							/>
							<FormInput
								control={form.control}
								name="vendor"
								label={t('field.vendor')}
								placeholder={t('field.vendorPlaceholder')}
							/>
						</div>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('field.description')}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t(
												'field.descriptionPlaceholder',
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

export function ExpenseForm(props: ExpenseFormProps) {
	const { open, onOpenChange, mode } = props;
	const t = useAppT('expenses');
	const tc = useT('common');
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-expense-form' : 'edit-expense-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? t('addSheet') : t('edit')}
			description={t('requiredHint')}
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						{mode === 'create' ? t('submitCreate') : t('submitUpdate')}
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreateExpenseForm
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			) : (
				<EditExpenseForm
					expense={(props as EditProps).expense}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
