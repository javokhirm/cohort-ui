import { useEffect, useState } from 'react';
import { useForm, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
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
import { formatPrice } from '@repo/utils';
import { isApiError } from '@repo/api-client';

import { FormSheet } from '@/components/FormSheet';
import { useBranches } from '@/api/branches';
import { useFeePlanList } from '@/features/billing/api/fee-plans.queries';

import {
	branchToForm,
	branchToPayload,
	createCourseSchema,
	editCourseSchema,
	isPlanBranchCompatible,
	SHARED_BRANCH_VALUE,
	type CreateCourseFormValues,
	type EditCourseFormValues,
} from '../schemas/course-form.schema';
import type { CourseResponse } from '../api/courses.queries';
import { useCreateCourse, useUpdateCourse } from '../api/courses.mutations';
import { COURSE_STATUS_OPTIONS } from '../lib/course-options';

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	course: CourseResponse;
}

type CourseFormProps = CreateProps | EditProps;

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

/**
 * Active plans this course may bill on, narrowed to the branch-compatible ones
 * — the same rule the server enforces (`FEE_PLAN_BRANCH_MISMATCH`), applied here
 * so an impossible choice is never offered. A shared course sees only shared
 * plans. The list re-narrows whenever the branch picker changes.
 */
function useFeePlanOptions(branch: string) {
	const { data, isPending } = useFeePlanList({ isActive: true, limit: 100 });
	const plans = data?.rows ?? [];
	const options = plans
		.filter((p) => isPlanBranchCompatible(p.branchId, branch))
		.map((p) => ({
			value: String(p.id),
			label: `${p.name} — ${formatPrice(p.amount)} ${p.currency}`,
		}));
	// `isPending` matters: until the plans land, "no options" means "not loaded",
	// not "none compatible" — callers must not act on an empty list before then.
	return { options, isPending };
}

/** Required fee-plan picker; explains itself when no compatible plan exists. */
function FeePlanField<T extends FieldValues>({
	control,
	options,
}: {
	control: Control<T>;
	options: { value: string; label: string }[];
}) {
	if (options.length === 0) {
		return (
			<div className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">Fee plan *</span>
				<p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
					No active fee plan is available for this branch. Create one on the Fee
					plans page first — a course cannot exist without the plan its groups
					bill on.
				</p>
			</div>
		);
	}
	return (
		<FormSelect
			control={control}
			name={'feePlan' as FieldPath<T>}
			label="Fee plan *"
			options={options}
		/>
	);
}

function CreateCourseForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const form = useForm<CreateCourseFormValues>({
		resolver: zodResolver(createCourseSchema),
		defaultValues: {
			name: '',
			branch: SHARED_BRANCH_VALUE,
			feePlan: '',
			level: '',
			description: '',
		},
	});

	const branchOptions = useBranchOptions();
	const createCourse = useCreateCourse();

	const branch = form.watch('branch');
	const { options: feePlanOptions, isPending: plansPending } =
		useFeePlanOptions(branch);

	useEffect(() => {
		onPendingChange(createCourse.isPending);
	}, [createCourse.isPending, onPendingChange]);

	// Switching branch can strand the chosen plan; drop it rather than submit a
	// value the server will reject. Guarded on `plansPending` so an empty list
	// mid-fetch never clears a valid selection.
	const selectedPlan = form.watch('feePlan');
	useEffect(() => {
		if (
			!plansPending &&
			selectedPlan &&
			!feePlanOptions.some((o) => o.value === selectedPlan)
		) {
			form.setValue('feePlan', '');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [branch, plansPending, feePlanOptions.length]);

	async function onSubmit(values: CreateCourseFormValues) {
		try {
			await createCourse.mutateAsync({
				branchId: branchToPayload(values.branch),
				feePlanId: Number(values.feePlan),
				name: values.name.trim(),
				description: values.description?.trim() || null,
				level: values.level?.trim() || null,
				defaultDurationWeeks: values.defaultDurationWeeks ?? null,
			});
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Something went wrong');
			return;
		}
		toast.success('Course added');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-course-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label="Course name *"
							placeholder="e.g. IELTS Prep"
						/>
						<FormSelect
							control={form.control}
							name="branch"
							label="Branch"
							options={branchOptions}
						/>
						<FeePlanField control={form.control} options={feePlanOptions} />
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="level"
								label="Level"
								placeholder="e.g. Upper-Intermediate"
							/>
							<FormInput
								control={form.control}
								name="defaultDurationWeeks"
								label="Default duration (weeks)"
								type="number"
								min={1}
								placeholder="e.g. 12"
								onChange={(e) =>
									form.setValue(
										'defaultDurationWeeks',
										e.target.value === ''
											? undefined
											: Number(e.target.value),
										{ shouldValidate: true },
									)
								}
							/>
						</div>
						<FormInput
							control={form.control}
							name="description"
							label="Description"
							placeholder="Short summary of the course"
						/>
					</FieldGroup>
				</Section>
			</form>
		</Form>
	);
}

function EditCourseForm({
	course,
	onSuccess,
	onPendingChange,
}: {
	course: CourseResponse;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const toDefaults = (c: CourseResponse): EditCourseFormValues => ({
		name: c.name,
		branch: branchToForm(c.branchId),
		feePlan: String(c.feePlanId),
		level: c.level ?? '',
		defaultDurationWeeks: c.defaultDurationWeeks ?? undefined,
		description: c.description ?? '',
		status: c.isActive ? 'active' : 'inactive',
	});

	const form = useForm<EditCourseFormValues>({
		resolver: zodResolver(editCourseSchema),
		defaultValues: toDefaults(course),
	});

	useEffect(() => {
		form.reset(toDefaults(course));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [course]);

	const branchOptions = useBranchOptions();
	const updateCourse = useUpdateCourse();

	const branch = form.watch('branch');
	const { options: feePlanOptions, isPending: plansPending } =
		useFeePlanOptions(branch);

	useEffect(() => {
		onPendingChange(updateCourse.isPending);
	}, [updateCourse.isPending, onPendingChange]);

	// Moving the course to another branch can strand its current plan; drop it so
	// the admin re-picks rather than submitting a value the server rejects.
	// Guarded on `plansPending` so an empty list mid-fetch never clears the
	// course's existing plan.
	const selectedPlan = form.watch('feePlan');
	useEffect(() => {
		if (
			!plansPending &&
			selectedPlan &&
			!feePlanOptions.some((o) => o.value === selectedPlan)
		) {
			form.setValue('feePlan', '');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [branch, plansPending, feePlanOptions.length]);

	async function onSubmit(values: EditCourseFormValues) {
		try {
			await updateCourse.mutateAsync({
				id: course.id,
				branchId: branchToPayload(values.branch),
				feePlanId: Number(values.feePlan),
				name: values.name.trim(),
				description: values.description?.trim() || null,
				level: values.level?.trim() || null,
				defaultDurationWeeks: values.defaultDurationWeeks ?? null,
				isActive: values.status === 'active',
			});
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Something went wrong');
			return;
		}
		toast.success('Course updated');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-course-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label="Course name *"
							placeholder="e.g. IELTS Prep"
						/>
						<FormSelect
							control={form.control}
							name="branch"
							label="Branch"
							options={branchOptions}
						/>
						<FeePlanField control={form.control} options={feePlanOptions} />
						<p className="text-xs text-muted-foreground">
							Changing the plan re-prices every future invoice for this
							course&apos;s groups. Invoices already issued keep their
							original plan.
						</p>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="level"
								label="Level"
								placeholder="e.g. Upper-Intermediate"
							/>
							<FormInput
								control={form.control}
								name="defaultDurationWeeks"
								label="Default duration (weeks)"
								type="number"
								min={1}
								placeholder="e.g. 12"
								onChange={(e) =>
									form.setValue(
										'defaultDurationWeeks',
										e.target.value === ''
											? undefined
											: Number(e.target.value),
										{ shouldValidate: true },
									)
								}
							/>
						</div>
						<FormInput
							control={form.control}
							name="description"
							label="Description"
							placeholder="Short summary of the course"
						/>
						<FormSelect
							control={form.control}
							name="status"
							label="Status"
							options={COURSE_STATUS_OPTIONS}
						/>
					</FieldGroup>
				</Section>
			</form>
		</Form>
	);
}

export function CourseForm(props: CourseFormProps) {
	const { open, onOpenChange, mode } = props;
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-course-form' : 'edit-course-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? 'Add course' : 'Edit course'}
			description="Fields marked * are required"
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						Save course
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreateCourseForm
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			) : (
				<EditCourseForm
					course={(props as EditProps).course}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
