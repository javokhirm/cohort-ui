import { useEffect, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	FieldGroup,
	Form,
	FormDatePicker,
	FormInput,
	FormMoneyInput,
	FormSelect,
	Spinner,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { todayIsoDate } from '@repo/utils';

import { FormSheet } from '@/components/FormSheet';
import {
	useCreatePayrollConfig,
	useUpdatePayrollConfig,
} from '@/features/payroll/api/payroll-configs.mutations';
import type { PayrollConfigResponse } from '@/features/payroll/api/payroll-configs.queries';

import {
	payrollConfigFormSchema,
	type PayrollConfigFormValues,
} from '../schemas/payroll-config-form.schema';

const PAYROLL_TYPE_OPTIONS = [
	{ value: 'FIXED', label: 'Fixed salary' },
	{ value: 'PERCENT', label: '% of student fees' },
];

const CREATE_FORM_ID = 'create-payroll-config-form';
const EDIT_FORM_ID = 'edit-payroll-config-form';

/**
 * The pay-model fields, shared by both modes. `lockType` disables the pay-model
 * select for edits — the backend keeps a window's type immutable, so offering
 * it would be a control that silently does nothing.
 */
function PayrollConfigFields({
	form,
	lockType,
}: {
	form: UseFormReturn<PayrollConfigFormValues>;
	lockType?: boolean;
}) {
	const payrollType = form.watch('payrollType');

	return (
		<FieldGroup>
			<FormSelect
				control={form.control}
				name="payrollType"
				label="Pay model *"
				options={PAYROLL_TYPE_OPTIONS}
				disabled={lockType}
			/>
			{lockType && (
				<p className="text-xs text-muted-foreground">
					A window keeps the pay model it opened with — switch between fixed and
					percentage pay by changing the pay model instead.
				</p>
			)}
			{payrollType === 'PERCENT' ? (
				<>
					<FormInput
						control={form.control}
						name="payrollPercent"
						label="Share of student fees (%) *"
						type="number"
						placeholder="e.g. 50"
						onChange={(e) =>
							form.setValue(
								'payrollPercent',
								e.target.value === ''
									? undefined
									: Number(e.target.value),
								{ shouldValidate: true },
							)
						}
					/>
					<p className="text-xs text-muted-foreground">
						The teacher earns this share of the tuition of students in their
						groups, prorated by completed sessions.
					</p>
				</>
			) : (
				<FormMoneyInput
					control={form.control}
					name="baseSalary"
					label="Monthly salary *"
					placeholder="0"
				/>
			)}
			<FormDatePicker
				control={form.control}
				name="effectiveFrom"
				label="Effective from *"
			/>
			<p className="text-xs text-muted-foreground">
				Payroll from this date uses this pay model.
			</p>
		</FieldGroup>
	);
}

function CreatePayrollConfigForm({
	staffId,
	onSuccess,
	onPendingChange,
}: {
	staffId: number;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const createConfig = useCreatePayrollConfig(staffId);
	const blankValues: PayrollConfigFormValues = {
		payrollType: 'FIXED',
		baseSalary: undefined,
		payrollPercent: undefined,
		effectiveFrom: todayIsoDate(),
	};
	const form = useForm<PayrollConfigFormValues>({
		resolver: zodResolver(payrollConfigFormSchema),
		defaultValues: blankValues,
	});

	useEffect(() => {
		onPendingChange(createConfig.isPending);
	}, [createConfig.isPending, onPendingChange]);

	async function onSubmit(values: PayrollConfigFormValues) {
		try {
			await createConfig.mutateAsync({
				payrollType: values.payrollType,
				baseSalary:
					values.payrollType === 'FIXED' ? values.baseSalary : undefined,
				payrollPercent:
					values.payrollType === 'PERCENT' ? values.payrollPercent : undefined,
				effectiveFrom: values.effectiveFrom,
			});
			toast.success('Pay model updated');
			onSuccess();
			form.reset(blankValues);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to update the pay model');
		}
	}

	return (
		<Form {...form}>
			<form
				id={CREATE_FORM_ID}
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<PayrollConfigFields form={form} />
			</form>
		</Form>
	);
}

function EditPayrollConfigForm({
	config,
	onSuccess,
	onPendingChange,
}: {
	config: PayrollConfigResponse;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const toDefaults = (c: PayrollConfigResponse): PayrollConfigFormValues => ({
		payrollType: c.payrollType,
		baseSalary: c.baseSalary ?? undefined,
		payrollPercent: c.payrollPercent ?? undefined,
		effectiveFrom: c.effectiveFrom,
	});

	const updateConfig = useUpdatePayrollConfig();
	const form = useForm<PayrollConfigFormValues>({
		resolver: zodResolver(payrollConfigFormSchema),
		defaultValues: toDefaults(config),
	});

	useEffect(() => {
		form.reset(toDefaults(config));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config]);

	useEffect(() => {
		onPendingChange(updateConfig.isPending);
	}, [updateConfig.isPending, onPendingChange]);

	async function onSubmit(values: PayrollConfigFormValues) {
		try {
			// No `payrollType` — see UpdatePayrollConfigInput. The type is read off
			// `values` only to decide which amount this window actually carries.
			await updateConfig.mutateAsync({
				id: config.id,
				baseSalary:
					values.payrollType === 'FIXED' ? values.baseSalary : undefined,
				payrollPercent:
					values.payrollType === 'PERCENT' ? values.payrollPercent : undefined,
				effectiveFrom: values.effectiveFrom,
			});
			toast.success('Pay window updated');
			onSuccess();
		} catch (err) {
			toast.error(
				isApiError(err) ? err.message : 'Failed to update the pay window',
			);
		}
	}

	return (
		<Form {...form}>
			<form
				id={EDIT_FORM_ID}
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<PayrollConfigFields form={form} lockType />
			</form>
		</Form>
	);
}

interface CreateProps {
	mode: 'create';
	staffId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	config: PayrollConfigResponse;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export type PayrollConfigSheetProps = CreateProps | EditProps;

/**
 * Create or correct one window of a staff member's pay-config timeline.
 *
 * - `create` opens a new window (`POST /staff/:id/payroll-configs`), closing the
 *   previous one — history keeps the model it was priced with.
 * - `edit` corrects a window in place (`PATCH /payroll-configs/:id`). The API
 *   accepts this only while no finalized payroll references the window; it 409s
 *   otherwise, which surfaces as a toast.
 */
export function PayrollConfigSheet(props: PayrollConfigSheetProps) {
	const { open, onOpenChange } = props;
	const [isPending, setIsPending] = useState(false);
	const isCreate = props.mode === 'create';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isCreate ? 'Change pay model' : 'Edit pay window'}
			description={
				isCreate
					? 'Opens a new pay window; earlier periods keep the model they were computed with.'
					: 'Corrects this window in place. Only windows no finalized payroll has priced can be edited.'
			}
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						form={isCreate ? CREATE_FORM_ID : EDIT_FORM_ID}
						disabled={isPending}
					>
						{isPending && <Spinner className="mr-2 size-4" />}
						{isCreate ? 'Save' : 'Save changes'}
					</Button>
				</>
			}
		>
			{props.mode === 'create' ? (
				<CreatePayrollConfigForm
					staffId={props.staffId}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			) : (
				<EditPayrollConfigForm
					config={props.config}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
