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
import { useBranches } from '@/api/branches';
import { useCourseList } from '@/features/courses/api/courses.queries';

import {
	ANY_COURSE_VALUE,
	branchToForm,
	branchToPayload,
	courseToForm,
	courseToPayload,
	createFeePlanSchema,
	editFeePlanSchema,
	SHARED_BRANCH_VALUE,
	type CreateFeePlanFormValues,
	type EditFeePlanFormValues,
} from '../schemas/fee-plan-form.schema';
import type { FeePlanResponse } from '../api/fee-plans.queries';
import { useCreateFeePlan, useUpdateFeePlan } from '../api/fee-plans.mutations';
import {
	FEE_PLAN_BILLING_CYCLE_OPTIONS,
	FEE_PLAN_STATUS_OPTIONS,
} from '../lib/fee-plan-options';

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

function Section({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-col gap-4 rounded-xl bg-white p-4">{children}</div>;
}

/** Branch options with a leading "shared across all branches" choice. */
function useBranchOptions() {
	const { data: branches = [] } = useBranches();
	return [
		{ value: SHARED_BRANCH_VALUE, label: 'Shared — all branches' },
		...branches.map((b) => ({ value: String(b.id), label: b.name })),
	];
}

/** Course options with a leading "any course" choice. */
function useCourseOptions() {
	const { data: courseData } = useCourseList({ limit: 100, isActive: true });
	const courses = courseData?.rows ?? [];
	return [
		{ value: ANY_COURSE_VALUE, label: 'Any course' },
		...courses.map((c) => ({ value: String(c.id), label: c.name })),
	];
}

function CreateFeePlanForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const form = useForm<CreateFeePlanFormValues>({
		resolver: zodResolver(createFeePlanSchema),
		defaultValues: {
			name: '',
			branch: SHARED_BRANCH_VALUE,
			course: ANY_COURSE_VALUE,
			billingCycle: 'MONTHLY',
			dueDay: 1,
			gracePeriodDays: 3,
			lateFeeAmount: 0,
		},
	});

	const branchOptions = useBranchOptions();
	const courseOptions = useCourseOptions();
	const createFeePlan = useCreateFeePlan();

	useEffect(() => {
		onPendingChange(createFeePlan.isPending);
	}, [createFeePlan.isPending, onPendingChange]);

	async function onSubmit(values: CreateFeePlanFormValues) {
		await createFeePlan.mutateAsync({
			branchId: branchToPayload(values.branch),
			courseId: courseToPayload(values.course),
			name: values.name.trim(),
			amount: values.amount,
			billingCycle: values.billingCycle,
			dueDay: values.dueDay,
			gracePeriodDays: values.gracePeriodDays,
			lateFeeAmount: values.lateFeeAmount,
		});
		toast.success('Fee plan added');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-fee-plan-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label="Plan name *"
							placeholder="e.g. Monthly Tuition — IELTS"
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="branch"
								label="Branch"
								options={branchOptions}
							/>
							<FormSelect
								control={form.control}
								name="course"
								label="Course"
								options={courseOptions}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="amount"
								label="Amount (UZS) *"
								type="number"
								min={1}
								placeholder="e.g. 1 300 000"
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
								label="Billing cycle"
								options={FEE_PLAN_BILLING_CYCLE_OPTIONS}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="dueDay"
								label="Due day (1–28)"
								type="number"
								min={1}
								max={28}
								onChange={(e) =>
									form.setValue(
										'dueDay',
										e.target.value === ''
											? (undefined as unknown as number)
											: Number(e.target.value),
										{ shouldValidate: true },
									)
								}
							/>
							<FormInput
								control={form.control}
								name="gracePeriodDays"
								label="Grace (days)"
								type="number"
								min={0}
								onChange={(e) =>
									form.setValue(
										'gracePeriodDays',
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
							name="lateFeeAmount"
							label="Late fee (UZS)"
							type="number"
							min={0}
							onChange={(e) =>
								form.setValue(
									'lateFeeAmount',
									e.target.value === ''
										? (undefined as unknown as number)
										: Number(e.target.value),
									{ shouldValidate: true },
								)
							}
						/>
					</FieldGroup>
				</Section>
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
	const toDefaults = (p: FeePlanResponse): EditFeePlanFormValues => ({
		name: p.name,
		branch: branchToForm(p.branchId),
		course: courseToForm(p.courseId),
		amount: p.amount,
		billingCycle: p.billingCycle,
		dueDay: p.dueDay,
		gracePeriodDays: p.gracePeriodDays,
		lateFeeAmount: p.lateFeeAmount,
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

	const branchOptions = useBranchOptions();
	const courseOptions = useCourseOptions();
	const updateFeePlan = useUpdateFeePlan();

	useEffect(() => {
		onPendingChange(updateFeePlan.isPending);
	}, [updateFeePlan.isPending, onPendingChange]);

	async function onSubmit(values: EditFeePlanFormValues) {
		await updateFeePlan.mutateAsync({
			id: feePlan.id,
			branchId: branchToPayload(values.branch),
			courseId: courseToPayload(values.course),
			name: values.name.trim(),
			amount: values.amount,
			billingCycle: values.billingCycle,
			dueDay: values.dueDay,
			gracePeriodDays: values.gracePeriodDays,
			lateFeeAmount: values.lateFeeAmount,
			isActive: values.status === 'active',
		});
		toast.success('Fee plan updated');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-fee-plan-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label="Plan name *"
							placeholder="e.g. Monthly Tuition — IELTS"
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="branch"
								label="Branch"
								options={branchOptions}
							/>
							<FormSelect
								control={form.control}
								name="course"
								label="Course"
								options={courseOptions}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="amount"
								label="Amount (UZS) *"
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
								label="Billing cycle"
								options={FEE_PLAN_BILLING_CYCLE_OPTIONS}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="dueDay"
								label="Due day (1–28)"
								type="number"
								min={1}
								max={28}
								onChange={(e) =>
									form.setValue(
										'dueDay',
										e.target.value === ''
											? (undefined as unknown as number)
											: Number(e.target.value),
										{ shouldValidate: true },
									)
								}
							/>
							<FormInput
								control={form.control}
								name="gracePeriodDays"
								label="Grace (days)"
								type="number"
								min={0}
								onChange={(e) =>
									form.setValue(
										'gracePeriodDays',
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
							name="lateFeeAmount"
							label="Late fee (UZS)"
							type="number"
							min={0}
							onChange={(e) =>
								form.setValue(
									'lateFeeAmount',
									e.target.value === ''
										? (undefined as unknown as number)
										: Number(e.target.value),
									{ shouldValidate: true },
								)
							}
						/>
						<FormSelect
							control={form.control}
							name="status"
							label="Status"
							options={FEE_PLAN_STATUS_OPTIONS}
						/>
					</FieldGroup>
				</Section>
			</form>
		</Form>
	);
}

export function FeePlanForm(props: FeePlanFormProps) {
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
			title={mode === 'create' ? 'New fee plan' : 'Edit fee plan'}
			description="Fields marked * are required"
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						Save fee plan
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
