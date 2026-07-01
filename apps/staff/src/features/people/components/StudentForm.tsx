import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@repo/ui';

import { Button, FieldGroup, Form, FormInput, FormSelect, Spinner } from '@repo/ui';

import { FormSheet } from '@/components/FormSheet';

import {
	createStudentSchema,
	editStudentSchema,
	splitFullName,
	type CreateStudentFormValues,
	type EditStudentFormValues,
} from '../schemas/student-form.schema';
import {
	useBranches,
	useGroups,
	useFeePlans,
	type Student,
} from '../api/students.queries';
import {
	useCreateStudent,
	useUpdateStudent,
	useEnrollStudent,
	useAddGuardian,
} from '../api/students.mutations';

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	student: Student;
}

type StudentFormProps = CreateProps | EditProps;

const GENDER_OPTIONS = [
	{ value: 'M', label: 'Male' },
	{ value: 'F', label: 'Female' },
];

const GUARDIAN_RELATION_OPTIONS = [
	{ value: 'father', label: 'Father' },
	{ value: 'mother', label: 'Mother' },
	{ value: 'guardian', label: 'Guardian' },
];

const STUDENT_STATUS_OPTIONS = [
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'INACTIVE', label: 'Inactive' },
	{ value: 'GRADUATED', label: 'Graduated' },
	{ value: 'SUSPENDED', label: 'Suspended' },
];

function Section({ heading, children }: { heading?: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-4 rounded-xl bg-white p-4">
			{heading && (
				<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					{heading}
				</p>
			)}
			{children}
		</div>
	);
}

function CreateStudentForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const form = useForm<CreateStudentFormValues>({
		resolver: zodResolver(createStudentSchema),
		defaultValues: {
			fullName: '',
			dateOfBirth: '',
			phone: '+998',
			address: '',
			guardianName: '',
			guardianPhone: '+998',
			guardianRelation: 'father',
		},
	});

	const { data: branches = [] } = useBranches();
	const selectedBranchId = form.watch('branchId');
	const { data: groupsPage } = useGroups(
		selectedBranchId ? { branchId: selectedBranchId } : undefined,
	);
	const groups = groupsPage?.rows ?? [];
	const { data: feePlansPage } = useFeePlans();
	const feePlans = feePlansPage?.rows ?? [];

	const createStudent = useCreateStudent();
	const addGuardian = useAddGuardian();
	const enrollStudent = useEnrollStudent();

	const isPending =
		createStudent.isPending || addGuardian.isPending || enrollStudent.isPending;

	useEffect(() => {
		onPendingChange(isPending);
	}, [isPending, onPendingChange]);

	async function onSubmit(values: CreateStudentFormValues) {
		const { firstName, lastName } = splitFullName(values.fullName);
		const { firstName: gFirst, lastName: gLast } = splitFullName(values.guardianName);

		let studentId: number;
		try {
			const result = await createStudent.mutateAsync({
				branchId: values.branchId,
				firstName,
				lastName,
				phone: values.phone,
				dateOfBirth: values.dateOfBirth || undefined,
				gender: values.gender,
				address: values.address || undefined,
			});
			studentId = result.id;
		} catch {
			return;
		}

		await addGuardian.mutateAsync({
			studentId,
			phone: values.guardianPhone,
			firstName: gFirst,
			lastName: gLast,
			relation: values.guardianRelation,
			isPrimary: true,
			canPickup: true,
		});

		if (values.groupId) {
			await enrollStudent.mutateAsync({
				groupId: values.groupId,
				studentId,
				feePlanId: values.feePlanId ?? null,
			});
		}

		toast.success('Student added successfully');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-student-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				{/* PERSONAL */}
				<Section heading="Personal">
					<FieldGroup>
						<FormInput
							control={form.control}
							name="fullName"
							label="Full name *"
							placeholder="e.g. Diyorbek Rustamov"
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="dateOfBirth"
								label="Date of birth"
								type="date"
							/>
							<FormSelect
								control={form.control}
								name="gender"
								label="Gender"
								options={GENDER_OPTIONS}
							/>
						</div>
					</FieldGroup>
				</Section>

				{/* CONTACT */}
				<Section heading="Contact">
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="phone"
								label="Phone *"
								placeholder="+998"
							/>
							<FormSelect
								control={form.control}
								name="branchId"
								label="Branch *"
								valueAsNumber
								options={branches.map((b) => ({
									value: String(b.id),
									label: b.name,
								}))}
							/>
						</div>
						<FormInput
							control={form.control}
							name="address"
							label="Address"
							placeholder="Street, district, city"
						/>
					</FieldGroup>
				</Section>

				{/* GUARDIAN */}
				<Section heading="Guardian">
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="guardianName"
								label="Guardian name *"
								placeholder="e.g. Rustam Olimov"
							/>
							<FormSelect
								control={form.control}
								name="guardianRelation"
								label="Relation"
								options={GUARDIAN_RELATION_OPTIONS}
							/>
						</div>
						<FormInput
							control={form.control}
							name="guardianPhone"
							label="Guardian phone *"
							placeholder="+998"
						/>
					</FieldGroup>
				</Section>

				{/* INITIAL ENROLLMENT */}
				{(groups.length > 0 || feePlans.length > 0) && (
					<Section heading="Initial enrollment">
						<FieldGroup>
							<div className="grid grid-cols-2 gap-3">
								<FormSelect
									control={form.control}
									name="groupId"
									label="Group"
									valueAsNumber
									options={groups.map((g) => ({
										value: String(g.id),
										label: g.code,
									}))}
								/>
								<FormSelect
									control={form.control}
									name="feePlanId"
									label="Fee plan"
									valueAsNumber
									options={feePlans.map((fp) => ({
										value: String(fp.id),
										label: fp.name,
									}))}
								/>
							</div>
						</FieldGroup>
					</Section>
				)}
			</form>
		</Form>
	);
}

function EditStudentForm({
	student,
	onSuccess,
	onPendingChange,
}: {
	student: Student;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const form = useForm<EditStudentFormValues>({
		resolver: zodResolver(editStudentSchema),
		defaultValues: {
			fullName: `${student.user.firstName} ${student.user.lastName}`,
			dateOfBirth: student.dateOfBirth ?? '',
			gender: student.gender ?? undefined,
			phone: student.user.phone,
			branchId: student.branchId,
			address: '',
			status: student.status,
		},
	});

	useEffect(() => {
		form.reset({
			fullName: `${student.user.firstName} ${student.user.lastName}`,
			dateOfBirth: student.dateOfBirth ?? '',
			gender: student.gender ?? undefined,
			phone: student.user.phone,
			branchId: student.branchId,
			address: '',
			status: student.status,
		});
	}, [student, form]);

	const { data: branches = [] } = useBranches();
	const updateStudent = useUpdateStudent();

	useEffect(() => {
		onPendingChange(updateStudent.isPending);
	}, [updateStudent.isPending, onPendingChange]);

	async function onSubmit(values: EditStudentFormValues) {
		await updateStudent.mutateAsync({
			id: student.id,
			branchId: values.branchId,
			dateOfBirth: values.dateOfBirth || undefined,
			gender: values.gender,
			address: values.address || undefined,
			status: values.status,
		});
		toast.success('Student updated');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-student-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				{/* PERSONAL */}
				<Section heading="Personal">
					<FieldGroup>
						<FormInput
							control={form.control}
							name="fullName"
							label="Full name"
							disabled
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="dateOfBirth"
								label="Date of birth"
								type="date"
							/>
							<FormSelect
								control={form.control}
								name="gender"
								label="Gender"
								options={GENDER_OPTIONS}
							/>
						</div>
					</FieldGroup>
				</Section>

				{/* CONTACT */}
				<Section heading="Contact">
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="phone"
								label="Phone"
								disabled
							/>
							<FormSelect
								control={form.control}
								name="branchId"
								label="Branch *"
								valueAsNumber
								options={branches.map((b) => ({
									value: String(b.id),
									label: b.name,
								}))}
							/>
						</div>
						<FormInput
							control={form.control}
							name="address"
							label="Address"
							placeholder="Street, district, city"
						/>
					</FieldGroup>
				</Section>

				{/* STATUS */}
				<Section heading="Status">
					<FormSelect
						control={form.control}
						name="status"
						label="Student status"
						options={STUDENT_STATUS_OPTIONS}
					/>
				</Section>
			</form>
		</Form>
	);
}

// ─── Sheet wrapper ────────────────────────────────────────────────────────────

export function StudentForm(props: StudentFormProps) {
	const { open, onOpenChange, mode } = props;
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-student-form' : 'edit-student-form';

	function handleSuccess() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? 'Add student' : 'Edit student'}
			description="Fields marked * are required"
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleSuccess}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						Save student
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreateStudentForm
					onSuccess={handleSuccess}
					onPendingChange={setIsPending}
				/>
			) : (
				<EditStudentForm
					student={(props as EditProps).student}
					onSuccess={handleSuccess}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
