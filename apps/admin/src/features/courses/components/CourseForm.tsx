import { useEffect, useMemo, useState } from 'react';
import { useForm, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';

import {
	Button,
	FieldGroup,
	Form,
	FormInput,
	FormSelect,
	Skeleton,
	Spinner,
	toast,
} from '@repo/ui';
import { formatPrice } from '@repo/utils';
import { isApiError } from '@repo/api-client';
import { useT } from '@repo/i18n';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { BranchSelectField } from '@/components/BranchSelectField';
import { DependencyMissingAlert } from '@/components/DependencyMissingAlert';
import { useAppT } from '@/locales';
import { SHARED_BRANCH_VALUE, branchToForm, branchToPayload } from '@/lib/branch';
import { useFeePlanList } from '@/features/billing/api/fee-plans.queries';

import {
	createCourseSchema,
	editCourseSchema,
	isPlanBranchCompatible,
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

/** Required fee-plan picker; disabled when no compatible plan exists. */
function FeePlanField<T extends FieldValues>({
	control,
	options,
	isPending,
}: {
	control: Control<T>;
	options: { value: string; label: string }[];
	isPending: boolean;
}) {
	const t = useAppT('courses');

	if (isPending) {
		return (
			<div className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">{t('field.feePlan')}</span>
				<Skeleton className="h-9 w-full" />
			</div>
		);
	}

	return (
		<FormSelect
			control={control}
			name={'feePlan' as FieldPath<T>}
			label={t('field.feePlan')}
			options={options}
			disabled={options.length === 0}
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
	const t = useAppT('courses');
	const tc = useT('common');
	const tv = useT('validation');
	const schema = useMemo(() => createCourseSchema(tv, t), [tv, t]);

	const form = useForm<CreateCourseFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: '',
			branch: SHARED_BRANCH_VALUE,
			feePlan: '',
			level: '',
			description: '',
		},
	});

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
			toast.error(isApiError(err) ? err.message : tc('error.unknown'));
			return;
		}
		toast.success(t('created'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-course-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				{!plansPending && feePlanOptions.length === 0 && (
					<DependencyMissingAlert
						description={t('feePlanEmpty')}
						action={
							<Link
								to="/fee-plans"
								className="font-medium text-tone-blue-fg underline underline-offset-2"
							>
								{t('feePlanEmptyCta')}
							</Link>
						}
					/>
				)}
				<FormSection>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label={t('field.name')}
							placeholder={t('field.namePlaceholder')}
						/>
						<BranchSelectField
							control={form.control}
							name="branch"
							label={t('field.branch')}
							sharedLabel={t('sharedOption')}
						/>
						<FeePlanField
							control={form.control}
							options={feePlanOptions}
							isPending={plansPending}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="level"
								label={t('field.level')}
								placeholder={t('field.levelPlaceholder')}
							/>
							<FormInput
								control={form.control}
								name="defaultDurationWeeks"
								label={t('field.duration')}
								type="number"
								min={1}
								placeholder={t('field.durationPlaceholder')}
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
							label={t('field.description')}
							placeholder={t('field.descriptionPlaceholder')}
						/>
					</FieldGroup>
				</FormSection>
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

	const t = useAppT('courses');
	const tc = useT('common');
	const tv = useT('validation');
	const schema = useMemo(() => editCourseSchema(tv, t), [tv, t]);

	const form = useForm<EditCourseFormValues>({
		resolver: zodResolver(schema),
		defaultValues: toDefaults(course),
	});

	useEffect(() => {
		form.reset(toDefaults(course));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [course]);

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
			toast.error(isApiError(err) ? err.message : tc('error.unknown'));
			return;
		}
		toast.success(t('updated'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-course-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				{!plansPending && feePlanOptions.length === 0 && (
					<DependencyMissingAlert
						description={t('feePlanEmpty')}
						action={
							<Link
								to="/fee-plans"
								className="font-medium text-tone-blue-fg underline underline-offset-2"
							>
								{t('feePlanEmptyCta')}
							</Link>
						}
					/>
				)}
				<FormSection>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label={t('field.name')}
							placeholder={t('field.namePlaceholder')}
						/>
						<BranchSelectField
							control={form.control}
							name="branch"
							label={t('field.branch')}
							sharedLabel={t('sharedOption')}
						/>
						<FeePlanField
							control={form.control}
							options={feePlanOptions}
							isPending={plansPending}
						/>
						<p className="text-xs text-muted-foreground">
							{t('planChangeWarning')}
						</p>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="level"
								label={t('field.level')}
								placeholder={t('field.levelPlaceholder')}
							/>
							<FormInput
								control={form.control}
								name="defaultDurationWeeks"
								label={t('field.duration')}
								type="number"
								min={1}
								placeholder={t('field.durationPlaceholder')}
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
							label={t('field.description')}
							placeholder={t('field.descriptionPlaceholder')}
						/>
						<FormSelect
							control={form.control}
							name="status"
							label={t('field.status')}
							options={COURSE_STATUS_OPTIONS.map((o) => ({
								value: o.value,
								label: tc(`state.${o.labelKey}`),
							}))}
						/>
					</FieldGroup>
				</FormSection>
			</form>
		</Form>
	);
}

export function CourseForm(props: CourseFormProps) {
	const { open, onOpenChange, mode } = props;
	const t = useAppT('courses');
	const tc = useT('common');
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-course-form' : 'edit-course-form';

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
						{t('save')}
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
