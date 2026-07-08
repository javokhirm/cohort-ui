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

import {
	branchToForm,
	branchToPayload,
	createCourseSchema,
	editCourseSchema,
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
			level: '',
			description: '',
		},
	});

	const branchOptions = useBranchOptions();
	const createCourse = useCreateCourse();

	useEffect(() => {
		onPendingChange(createCourse.isPending);
	}, [createCourse.isPending, onPendingChange]);

	async function onSubmit(values: CreateCourseFormValues) {
		await createCourse.mutateAsync({
			branchId: branchToPayload(values.branch),
			name: values.name.trim(),
			description: values.description?.trim() || null,
			level: values.level?.trim() || null,
			defaultDurationWeeks: values.defaultDurationWeeks ?? null,
		});
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

	useEffect(() => {
		onPendingChange(updateCourse.isPending);
	}, [updateCourse.isPending, onPendingChange]);

	async function onSubmit(values: EditCourseFormValues) {
		await updateCourse.mutateAsync({
			id: course.id,
			branchId: branchToPayload(values.branch),
			name: values.name.trim(),
			description: values.description?.trim() || null,
			level: values.level?.trim() || null,
			defaultDurationWeeks: values.defaultDurationWeeks ?? null,
			isActive: values.status === 'active',
		});
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
