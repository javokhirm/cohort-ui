import { useEffect, useMemo, useState } from 'react';
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
import { useT } from '@repo/i18n';
import { isApiError } from '@repo/api-client';
import { todayIsoDate } from '@repo/utils';

import { FormSheet } from '@/components/FormSheet';
import { useAppT } from '@/locales';
import {
	useCreatePayrollConfig,
	useUpdatePayrollConfig,
} from '@/features/payroll/api/payroll-configs.mutations';
import type { PayrollConfigResponse } from '@/features/payroll/api/payroll-configs.queries';

import {
	payrollConfigFormSchema,
	type PayrollConfigFormValues,
} from '../schemas/payroll-config-form.schema';

/** Values only — labels resolve at render (conventions.md §7). */
const PAYROLL_TYPE_OPTIONS = [{ value: 'FIXED' }, { value: 'PERCENT' }] as const;

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
	const t = useAppT('hr');
	const payrollType = form.watch('payrollType');

	return (
		<FieldGroup>
			<FormSelect
				control={form.control}
				name="payrollType"
				label={t('payroll.field.model')}
				options={PAYROLL_TYPE_OPTIONS.map((o) => ({
					value: o.value,
					label: t(`payroll.type.${o.value}`),
				}))}
				disabled={lockType}
			/>
			{lockType && (
				<p className="text-xs text-muted-foreground">
					{t('payroll.sheet.lockTypeHint')}
				</p>
			)}
			{payrollType === 'PERCENT' ? (
				<>
					<FormInput
						control={form.control}
						name="payrollPercent"
						label={t('payroll.field.percent')}
						type="number"
						placeholder={t('payroll.field.percentPlaceholder')}
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
						{t('payroll.field.percentHint')}
					</p>
				</>
			) : (
				<FormMoneyInput
					control={form.control}
					name="baseSalary"
					label={t('payroll.field.salary')}
					placeholder="0"
				/>
			)}
			<FormDatePicker
				control={form.control}
				name="effectiveFrom"
				label={t('payroll.field.effectiveFrom')}
			/>
			<p className="text-xs text-muted-foreground">
				{t('payroll.field.effectiveFromHint')}
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
	const t = useAppT('hr');
	const tv = useT('validation');
	const schema = useMemo(() => payrollConfigFormSchema(tv, t), [tv, t]);

	const createConfig = useCreatePayrollConfig(staffId);
	const blankValues: PayrollConfigFormValues = {
		payrollType: 'FIXED',
		baseSalary: undefined,
		payrollPercent: undefined,
		effectiveFrom: todayIsoDate(),
	};
	const form = useForm<PayrollConfigFormValues>({
		resolver: zodResolver(schema),
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
			toast.success(t('payroll.sheet.updatedModel'));
			onSuccess();
			form.reset(blankValues);
		} catch (err) {
			toast.error(
				isApiError(err) ? err.message : t('payroll.sheet.updateModelFailed'),
			);
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

	const t = useAppT('hr');
	const tv = useT('validation');
	const schema = useMemo(() => payrollConfigFormSchema(tv, t), [tv, t]);

	const updateConfig = useUpdatePayrollConfig();
	const form = useForm<PayrollConfigFormValues>({
		resolver: zodResolver(schema),
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
			toast.success(t('payroll.sheet.updatedWindow'));
			onSuccess();
		} catch (err) {
			toast.error(
				isApiError(err) ? err.message : t('payroll.sheet.updateWindowFailed'),
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
	const t = useAppT('hr');
	const tc = useT('common');
	const [isPending, setIsPending] = useState(false);
	const isCreate = props.mode === 'create';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={
				isCreate ? t('payroll.sheet.createTitle') : t('payroll.sheet.editTitle')
			}
			description={
				isCreate
					? t('payroll.sheet.createDescription')
					: t('payroll.sheet.editDescription')
			}
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						{tc('action.cancel')}
					</Button>
					<Button
						type="submit"
						form={isCreate ? CREATE_FORM_ID : EDIT_FORM_ID}
						disabled={isPending}
					>
						{isPending && <Spinner className="mr-2 size-4" />}
						{isCreate ? tc('action.save') : tc('action.save')}
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
