import { useEffect, useState } from 'react';
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

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { useBranches } from '@/api/branches';
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
	const activeBranchIds = useActiveBranchIds();
	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseFormSchema),
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

	const { data: branches = [] } = useBranches();
	const branchOptions = branches.map((b) => ({ value: String(b.id), label: b.name }));

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
		toast.success('Expense recorded');
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
								label="Category *"
								options={EXPENSE_CATEGORY_OPTIONS}
							/>
							<FormSelect
								control={form.control}
								name="branchId"
								label="Branch *"
								options={branchOptions}
								valueAsNumber
							/>
						</div>
						<FormInput
							control={form.control}
							name="amount"
							label="Amount (UZS) *"
							type="number"
							min={0}
							placeholder="e.g. 12 000 000"
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
								label="Date *"
							/>
							<FormInput
								control={form.control}
								name="vendor"
								label="Vendor"
								placeholder="Vendor name"
							/>
						</div>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
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

	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseFormSchema),
		defaultValues: toDefaults(expense),
	});

	useEffect(() => {
		form.reset(toDefaults(expense));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [expense]);

	const { data: branches = [] } = useBranches();
	const branchOptions = branches.map((b) => ({ value: String(b.id), label: b.name }));

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
		toast.success('Expense updated');
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
								label="Category *"
								options={EXPENSE_CATEGORY_OPTIONS}
							/>
							<FormSelect
								control={form.control}
								name="branchId"
								label="Branch *"
								options={branchOptions}
								valueAsNumber
							/>
						</div>
						<FormInput
							control={form.control}
							name="amount"
							label="Amount (UZS) *"
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
								label="Date *"
							/>
							<FormInput
								control={form.control}
								name="vendor"
								label="Vendor"
								placeholder="Vendor name"
							/>
						</div>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
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
				</FormSection>
			</form>
		</Form>
	);
}

export function ExpenseForm(props: ExpenseFormProps) {
	const { open, onOpenChange, mode } = props;
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-expense-form' : 'edit-expense-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? 'Add expense' : 'Edit expense'}
			description="Fields marked * are required"
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						{mode === 'create' ? 'Record expense' : 'Save changes'}
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
