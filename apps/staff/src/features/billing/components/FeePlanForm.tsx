import { useEffect, useState } from 'react';
import { useForm, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	Checkbox,
	FieldGroup,
	Form,
	FormField,
	FormInput,
	FormItem,
	FormLabel,
	FormMessage,
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
	FEE_PLAN_PRORATION_OPTIONS,
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

/**
 * Checkbox bound to a boolean form field — gates whether a per-plan override is
 * sent (checked) or the value is left `null` to inherit the tenant billing
 * policy default (unchecked). Generic so both forms can share it.
 */
function OverrideToggle<T extends FieldValues>({
	control,
	name,
	label,
}: {
	control: Control<T>;
	name: FieldPath<T>;
	label: string;
}) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
					<Checkbox
						checked={Boolean(field.value)}
						onCheckedChange={(v) => field.onChange(v === true)}
					/>
					{label}
				</label>
			)}
		/>
	);
}

/**
 * Segmented proration control (mid-month joins). Generic over the form values so
 * both the create and edit forms can share it — both carry a `prorationMethod`.
 */
function ProrationField<T extends FieldValues>({ control }: { control: Control<T> }) {
	return (
		<FormField
			control={control}
			name={'prorationMethod' as FieldPath<T>}
			render={({ field }) => (
				<FormItem>
					<FormLabel>Proration (mid-month joins)</FormLabel>
					<div className="grid grid-cols-3 gap-2">
						{FEE_PLAN_PRORATION_OPTIONS.map((o) => (
							<Button
								key={o.value}
								type="button"
								variant={field.value === o.value ? 'default' : 'outline'}
								onClick={() => field.onChange(o.value)}
							>
								{o.label}
							</Button>
						))}
					</div>
					<p className="text-xs text-muted-foreground">
						Applies to the first partial month only — later months bill in
						full. Session-based falls back to daily proration when a group has
						no schedule.
					</p>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
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
			overrideDueDay: false,
			dueDay: 1,
			overrideProration: false,
			prorationMethod: 'SESSION',
		},
	});

	const branchOptions = useBranchOptions();
	const courseOptions = useCourseOptions();
	const createFeePlan = useCreateFeePlan();

	const overrideDueDay = form.watch('overrideDueDay');
	const overrideProration = form.watch('overrideProration');

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
			dueDay: values.overrideDueDay ? values.dueDay : null,
			prorationMethod: values.overrideProration ? values.prorationMethod : null,
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
						<div className="flex flex-col gap-2">
							<OverrideToggle
								control={form.control}
								name="overrideDueDay"
								label="Override tenant default due day"
							/>
							{overrideDueDay ? (
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
							) : (
								<p className="text-xs text-muted-foreground">
									Inherits the tenant billing policy due-day.
								</p>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<OverrideToggle
								control={form.control}
								name="overrideProration"
								label="Override tenant default proration"
							/>
							{overrideProration ? (
								<ProrationField control={form.control} />
							) : (
								<p className="text-xs text-muted-foreground">
									Inherits the tenant billing policy proration method.
								</p>
							)}
						</div>
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
		overrideDueDay: p.dueDay != null,
		dueDay: p.dueDay ?? 1,
		overrideProration: p.prorationMethod != null,
		prorationMethod: p.prorationMethod ?? 'SESSION',
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

	const overrideDueDay = form.watch('overrideDueDay');
	const overrideProration = form.watch('overrideProration');

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
			dueDay: values.overrideDueDay ? values.dueDay : null,
			prorationMethod: values.overrideProration ? values.prorationMethod : null,
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
						<div className="flex flex-col gap-2">
							<OverrideToggle
								control={form.control}
								name="overrideDueDay"
								label="Override tenant default due day"
							/>
							{overrideDueDay ? (
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
							) : (
								<p className="text-xs text-muted-foreground">
									Inherits the tenant billing policy due-day.
								</p>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<OverrideToggle
								control={form.control}
								name="overrideProration"
								label="Override tenant default proration"
							/>
							{overrideProration ? (
								<ProrationField control={form.control} />
							) : (
								<p className="text-xs text-muted-foreground">
									Inherits the tenant billing policy proration method.
								</p>
							)}
						</div>
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
