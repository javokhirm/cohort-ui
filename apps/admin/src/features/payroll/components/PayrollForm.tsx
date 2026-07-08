import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	FieldGroup,
	Form,
	FormControl,
	FormField,
	FormInput,
	FormItem,
	FormLabel,
	FormSelect,
	Spinner,
	Switch,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { toIsoDate } from '@repo/utils';

import { FormSheet } from '@/components/FormSheet';
import { useStaffList } from '@/features/hr/api/staff.queries';

import {
	createPayrollSchema,
	editPayrollSchema,
	type CreatePayrollFormValues,
	type EditPayrollFormValues,
} from '../schemas/payroll-form.schema';
import type { PayrollResponse } from '../api/payroll.queries';
import { useCreatePayroll, useUpdatePayroll } from '../api/payroll.mutations';

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	payroll: PayrollResponse;
}

type PayrollFormProps = CreateProps | EditProps;

function Section({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-col gap-4 rounded-xl bg-white p-4">{children}</div>;
}

/** Current month [start, end] as YYYY-MM-DD, computed at call time (never module scope). */
function currentMonthRange(): { start: string; end: string } {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	return { start: toIsoDate(start), end: toIsoDate(end) };
}

function CreatePayrollForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const defaults = currentMonthRange();
	const form = useForm<CreatePayrollFormValues>({
		resolver: zodResolver(createPayrollSchema),
		defaultValues: {
			staffId: undefined as unknown as number,
			periodStart: defaults.start,
			periodEnd: defaults.end,
			autoCalculate: true,
			grossAmount: undefined,
			deductions: undefined,
		},
	});

	const { data: staffData } = useStaffList({ status: 'ACTIVE', limit: 100 });
	const staff = staffData?.rows ?? [];
	const staffOptions = staff.map((s) => ({
		value: String(s.id),
		label: `${s.user.firstName} ${s.user.lastName} (${s.staffCode})`,
	}));

	const autoCalculate = form.watch('autoCalculate');

	const createPayroll = useCreatePayroll();

	useEffect(() => {
		onPendingChange(createPayroll.isPending);
	}, [createPayroll.isPending, onPendingChange]);

	async function onSubmit(values: CreatePayrollFormValues) {
		const selectedStaff = staff.find((s) => s.id === values.staffId);
		if (!selectedStaff) {
			toast.error('Select a staff member');
			return;
		}
		try {
			await createPayroll.mutateAsync({
				branchId: selectedStaff.branchId,
				staffId: values.staffId,
				periodStart: values.periodStart,
				periodEnd: values.periodEnd,
				autoCalculate: values.autoCalculate,
				grossAmount: values.autoCalculate ? undefined : values.grossAmount,
				deductions: values.deductions,
			});
			toast.success('Payroll record created');
			onSuccess();
		} catch (err) {
			toast.error(
				isApiError(err) ? err.message : 'Failed to create payroll record',
			);
		}
	}

	return (
		<Form {...form}>
			<form
				id="create-payroll-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section>
					<FieldGroup>
						<FormSelect
							control={form.control}
							name="staffId"
							label="Staff *"
							options={staffOptions}
							valueAsNumber
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="periodStart"
								label="Period start *"
								type="date"
							/>
							<FormInput
								control={form.control}
								name="periodEnd"
								label="Period end *"
								type="date"
							/>
						</div>
					</FieldGroup>
				</Section>

				<Section>
					<FormField
						control={form.control}
						name="autoCalculate"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between gap-3">
								<div className="flex flex-col gap-0.5">
									<FormLabel className="text-sm font-medium">
										Auto-calculate
									</FormLabel>
									<p className="text-xs text-muted-foreground">
										From sessions taught × rate + bonuses
									</p>
								</div>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
					<div className="grid grid-cols-2 gap-3">
						{!autoCalculate && (
							<FormInput
								control={form.control}
								name="grossAmount"
								label="Gross amount (UZS) *"
								type="number"
								min={0}
								onChange={(e) =>
									form.setValue(
										'grossAmount',
										e.target.value === ''
											? undefined
											: Number(e.target.value),
										{ shouldValidate: true },
									)
								}
							/>
						)}
						<FormInput
							control={form.control}
							name="deductions"
							label="Deductions (UZS)"
							type="number"
							min={0}
							onChange={(e) =>
								form.setValue(
									'deductions',
									e.target.value === ''
										? undefined
										: Number(e.target.value),
									{ shouldValidate: true },
								)
							}
						/>
					</div>
				</Section>
			</form>
		</Form>
	);
}

function EditPayrollForm({
	payroll,
	onSuccess,
	onPendingChange,
}: {
	payroll: PayrollResponse;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const toDefaults = (p: PayrollResponse): EditPayrollFormValues => ({
		grossAmount: p.grossAmount,
		deductions: p.deductions,
		hoursTaught: p.breakdown?.hoursTaught,
		rate: p.breakdown?.rate,
		bonuses: p.breakdown?.bonuses,
	});

	const form = useForm<EditPayrollFormValues>({
		resolver: zodResolver(editPayrollSchema),
		defaultValues: toDefaults(payroll),
	});

	useEffect(() => {
		form.reset(toDefaults(payroll));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [payroll]);

	const updatePayroll = useUpdatePayroll();

	useEffect(() => {
		onPendingChange(updatePayroll.isPending);
	}, [updatePayroll.isPending, onPendingChange]);

	async function onSubmit(values: EditPayrollFormValues) {
		// Only send `breakdown` when at least one sub-field is set — an empty
		// object would overwrite (wipe) any breakdown already stored server-side.
		const hasBreakdown =
			values.hoursTaught != null || values.rate != null || values.bonuses != null;
		try {
			await updatePayroll.mutateAsync({
				id: payroll.id,
				grossAmount: values.grossAmount,
				deductions: values.deductions,
				breakdown: hasBreakdown
					? {
							hoursTaught: values.hoursTaught,
							rate: values.rate,
							bonuses: values.bonuses,
						}
					: undefined,
			});
			toast.success('Payroll record updated');
			onSuccess();
		} catch (err) {
			toast.error(
				isApiError(err) ? err.message : 'Failed to update payroll record',
			);
		}
	}

	function numberField(
		name: 'grossAmount' | 'deductions' | 'hoursTaught' | 'rate' | 'bonuses',
	) {
		return (e: React.ChangeEvent<HTMLInputElement>) =>
			form.setValue(
				name,
				e.target.value === '' ? undefined : Number(e.target.value),
				{
					shouldValidate: true,
				},
			);
	}

	return (
		<Form {...form}>
			<form
				id="edit-payroll-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="grossAmount"
								label="Gross amount (UZS) *"
								type="number"
								min={0}
								onChange={numberField('grossAmount')}
							/>
							<FormInput
								control={form.control}
								name="deductions"
								label="Deductions (UZS)"
								type="number"
								min={0}
								onChange={numberField('deductions')}
							/>
						</div>
					</FieldGroup>
				</Section>

				<Section>
					<span className="text-sm font-semibold text-muted-foreground">
						Breakdown
					</span>
					<FieldGroup>
						<div className="grid grid-cols-3 gap-3">
							<FormInput
								control={form.control}
								name="hoursTaught"
								label="Hours taught"
								type="number"
								min={0}
								onChange={numberField('hoursTaught')}
							/>
							<FormInput
								control={form.control}
								name="rate"
								label="Rate (UZS)"
								type="number"
								min={0}
								onChange={numberField('rate')}
							/>
							<FormInput
								control={form.control}
								name="bonuses"
								label="Bonuses (UZS)"
								type="number"
								min={0}
								onChange={numberField('bonuses')}
							/>
						</div>
					</FieldGroup>
				</Section>
			</form>
		</Form>
	);
}

export function PayrollForm(props: PayrollFormProps) {
	const { open, onOpenChange, mode } = props;
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-payroll-form' : 'edit-payroll-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? 'Add payroll record' : 'Edit payroll record'}
			description={
				mode === 'create'
					? 'Creates a single DRAFT payroll record for one staff member.'
					: 'Only DRAFT records can be edited — net pay is recalculated on save.'
			}
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						{mode === 'create' ? 'Create record' : 'Save changes'}
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreatePayrollForm
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			) : (
				<EditPayrollForm
					payroll={(props as EditProps).payroll}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
