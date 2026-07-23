import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { isApiError } from '@repo/api-client';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { BranchSelectField } from '@/components/BranchSelectField';
import { SHARED_BRANCH_VALUE, branchToForm, branchToPayload } from '@/lib/branch';

import {
	createFeePlanSchema,
	editFeePlanSchema,
	type CreateFeePlanFormValues,
	type EditFeePlanFormValues,
} from '../schemas/fee-plan-form.schema';
import type { FeePlanResponse } from '../api/fee-plans.queries';
import { useCreateFeePlan, useUpdateFeePlan } from '../api/fee-plans.mutations';
import {
	FEE_PLAN_AMOUNT_LABEL_KEYS,
	FEE_PLAN_BILLING_CYCLE_OPTIONS,
	FEE_PLAN_STATUS_OPTIONS,
} from '../lib/fee-plan-options';
import { FeePlanGroupsSection } from './FeePlanGroupsSection';

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	feePlan: FeePlanResponse;
}

type FeePlanFormProps = CreateProps | EditProps;

function CreateFeePlanForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('billing');
	const form = useForm<CreateFeePlanFormValues>({
		resolver: zodResolver(createFeePlanSchema),
		defaultValues: {
			name: '',
			branch: SHARED_BRANCH_VALUE,
			billingCycle: 'MONTHLY',
		},
	});

	const createFeePlan = useCreateFeePlan();

	// `useWatch` over `form.watch()`: the latter hands back a fresh function the
	// React Compiler cannot memoize safely.
	const billingCycle = useWatch({ control: form.control, name: 'billingCycle' });

	useEffect(() => {
		onPendingChange(createFeePlan.isPending);
	}, [createFeePlan.isPending, onPendingChange]);

	async function onSubmit(values: CreateFeePlanFormValues) {
		await createFeePlan.mutateAsync({
			branchId: branchToPayload(values.branch),
			name: values.name.trim(),
			amount: values.amount,
			billingCycle: values.billingCycle,
		});
		toast.success(t('feePlanExtra.added'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-fee-plan-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label={t('feePlans.field.name')}
							placeholder={t('invoiceExtra.linePlaceholder')}
						/>
						<BranchSelectField
							control={form.control}
							name="branch"
							label={t('feePlans.field.branch')}
							sharedLabel={t('feePlanForm.sharedOption')}
						/>
						<p className="text-xs text-muted-foreground">
							{t('feePlanForm.standaloneHint')}
						</p>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="amount"
								label={t(
									`feePlans.field.${FEE_PLAN_AMOUNT_LABEL_KEYS[billingCycle]}`,
								)}
								type="number"
								min={1}
								placeholder={t('invoiceExtra.amountPlaceholder')}
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
							<FormSelect
								control={form.control}
								name="billingCycle"
								label={t('feePlans.field.cycle')}
								options={FEE_PLAN_BILLING_CYCLE_OPTIONS.map((o) => ({
									value: o.value,
									label: t(`billingCycle.${o.value}`),
								}))}
							/>
						</div>
					</FieldGroup>
				</FormSection>
			</form>
		</Form>
	);
}

function EditFeePlanForm({
	feePlan,
	onSuccess,
	onPendingChange,
}: {
	feePlan: FeePlanResponse;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('billing');
	const tc = useT('common');
	const toDefaults = (p: FeePlanResponse): EditFeePlanFormValues => ({
		name: p.name,
		branch: branchToForm(p.branchId),
		amount: p.amount,
		billingCycle: p.billingCycle,
		status: p.isActive ? 'active' : 'inactive',
	});

	const form = useForm<EditFeePlanFormValues>({
		resolver: zodResolver(editFeePlanSchema),
		defaultValues: toDefaults(feePlan),
	});

	useEffect(() => {
		form.reset(toDefaults(feePlan));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [feePlan]);

	const updateFeePlan = useUpdateFeePlan();

	// `useWatch` over `form.watch()`: the latter hands back a fresh function the
	// React Compiler cannot memoize safely.
	const billingCycle = useWatch({ control: form.control, name: 'billingCycle' });

	useEffect(() => {
		onPendingChange(updateFeePlan.isPending);
	}, [updateFeePlan.isPending, onPendingChange]);

	async function onSubmit(values: EditFeePlanFormValues) {
		try {
			await updateFeePlan.mutateAsync({
				id: feePlan.id,
				branchId: branchToPayload(values.branch),
				name: values.name.trim(),
				amount: values.amount,
				billingCycle: values.billingCycle,
				isActive: values.status === 'active',
			});
		} catch (err) {
			// Deactivating a plan a live course uses would silently stop billing
			// its groups; the server refuses. Say what to do about it.
			if (isApiError(err) && err.status === 409) {
				toast.error(
					'Courses are still using this plan. Move them to another plan before deactivating it.',
				);
			} else if (isApiError(err)) {
				toast.error(err.message);
			} else {
				toast.error(tc('error.unknown'));
			}
			return;
		}
		toast.success(t('feePlans.updated'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-fee-plan-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label={t('feePlans.field.name')}
							placeholder={t('invoiceExtra.linePlaceholder')}
						/>
						<BranchSelectField
							control={form.control}
							name="branch"
							label={t('feePlans.field.branch')}
							sharedLabel={t('feePlanForm.sharedOption')}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="amount"
								label={t(
									`feePlans.field.${FEE_PLAN_AMOUNT_LABEL_KEYS[billingCycle]}`,
								)}
								type="number"
								min={1}
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
							<FormSelect
								control={form.control}
								name="billingCycle"
								label={t('feePlans.field.cycle')}
								options={FEE_PLAN_BILLING_CYCLE_OPTIONS.map((o) => ({
									value: o.value,
									label: t(`billingCycle.${o.value}`),
								}))}
							/>
						</div>
						<FormSelect
							control={form.control}
							name="status"
							label={t('feePlans.field.status')}
							options={FEE_PLAN_STATUS_OPTIONS.map((o) => ({
								value: o.value,
								label: tc(`state.${o.labelKey}`),
							}))}
						/>
					</FieldGroup>
				</FormSection>

				<FeePlanGroupsSection feePlanId={feePlan.id} />
			</form>
		</Form>
	);
}

export function FeePlanForm(props: FeePlanFormProps) {
	const t = useAppT('billing');
	const tc = useT('common');
	const { open, onOpenChange, mode } = props;
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-fee-plan-form' : 'edit-fee-plan-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? t('feePlans.addSheet') : t('feePlans.edit')}
			description={t('feePlans.requiredHint')}
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						{t('misc.saveFeePlan')}
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreateFeePlanForm
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			) : (
				<EditFeePlanForm
					feePlan={(props as EditProps).feePlan}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
