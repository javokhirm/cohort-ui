import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { toast } from '@repo/ui';

import {
	Button,
	FieldGroup,
	Form,
	FormDatePicker,
	FormInput,
	FormPhoneInput,
	FormSelect,
	Spinner,
} from '@repo/ui';
import { useStatusLabel, useT } from '@repo/i18n';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { useAppT } from '@/locales';

import {
	createStudentSchema,
	editStudentSchema,
	splitFullName,
	type CreateStudentFormValues,
	type EditStudentFormValues,
} from '../schemas/student-form.schema';
import { useBranches } from '@/api/branches';
import { useBranchStore } from '@/store/branchStore';
import { useGroups, type Student } from '../api/students.queries';
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

/**
 * Option tables hold **values only** — labels resolve at render against the
 * `people` namespace (or `enums.domain.student.*` for statuses), so a language
 * switch re-translates every dropdown (conventions.md §7).
 */
const GENDER_OPTIONS = [{ value: 'M' }, { value: 'F' }] as const;

const GUARDIAN_RELATION_OPTIONS = [
	{ value: 'father' },
	{ value: 'mother' },
	{ value: 'guardian' },
] as const;

const STUDENT_STATUS_OPTIONS = [
	{ value: 'ACTIVE' },
	{ value: 'INACTIVE' },
	{ value: 'GRADUATED' },
	{ value: 'SUSPENDED' },
] as const;

function CreateStudentForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('people');
	const tv = useT('validation');
	const schema = useMemo(() => createStudentSchema(tv, t), [tv, t]);

	// When exactly one branch is selected globally, pre-fill it (still editable).
	const activeBranchIds = useBranchStore((s) => s.activeBranchIds);
	const defaultBranchId =
		activeBranchIds?.length === 1 ? activeBranchIds[0] : undefined;

	const form = useForm<CreateStudentFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			firstName: '',
			lastName: '',
			dateOfBirth: '',
			phone: '',
			branchId: defaultBranchId,
			address: '',
			hasGuardian: false,
			guardianName: '',
			guardianPhone: '',
			guardianRelation: 'father',
		},
	});

	const hasGuardian = form.watch('hasGuardian');

	function handleRemoveGuardian() {
		form.setValue('hasGuardian', false);
		form.resetField('guardianName');
		form.resetField('guardianPhone');
		form.resetField('guardianRelation');
	}

	const { data: branches = [] } = useBranches();
	const selectedBranchId = form.watch('branchId');
	const { data: groupsPage } = useGroups(
		selectedBranchId ? { branchIds: [selectedBranchId] } : undefined,
	);
	const groups = groupsPage?.rows ?? [];

	const createStudent = useCreateStudent();
	const addGuardian = useAddGuardian();
	const enrollStudent = useEnrollStudent();

	const isPending =
		createStudent.isPending || addGuardian.isPending || enrollStudent.isPending;

	useEffect(() => {
		onPendingChange(isPending);
	}, [isPending, onPendingChange]);

	async function onSubmit(values: CreateStudentFormValues) {
		let studentId: number;
		try {
			const result = await createStudent.mutateAsync({
				branchId: values.branchId,
				firstName: values.firstName,
				lastName: values.lastName,
				phone: values.phone,
				dateOfBirth: values.dateOfBirth || undefined,
				gender: values.gender,
				address: values.address || undefined,
			});
			studentId = result.id;
		} catch {
			return;
		}

		if (values.hasGuardian) {
			const { firstName: gFirst, lastName: gLast } = splitFullName(
				values.guardianName ?? '',
			);
			await addGuardian.mutateAsync({
				studentId,
				phone: values.guardianPhone ?? '',
				firstName: gFirst,
				lastName: gLast,
				relation: values.guardianRelation ?? 'guardian',
				isPrimary: true,
				canPickup: true,
			});
		}

		if (values.groupId) {
			await enrollStudent.mutateAsync({ groupId: values.groupId, studentId });
		}

		toast.success(t('created'));
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
				<FormSection title={t('form.section.personal')}>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="firstName"
								label={t('form.field.firstName')}
								placeholder={t('form.field.firstNamePlaceholder')}
							/>
							<FormInput
								control={form.control}
								name="lastName"
								label={t('form.field.lastName')}
								placeholder={t('form.field.lastNamePlaceholder')}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<FormDatePicker
								control={form.control}
								name="dateOfBirth"
								label={t('form.field.dateOfBirth')}
							/>
							<FormSelect
								control={form.control}
								name="gender"
								label={t('form.field.gender')}
								options={GENDER_OPTIONS.map((o) => ({
									value: o.value,
									label: t(`gender.${o.value}`),
								}))}
							/>
						</div>
					</FieldGroup>
				</FormSection>

				{/* CONTACT */}
				<FormSection title={t('form.section.contact')}>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormPhoneInput
								control={form.control}
								name="phone"
								label={t('form.field.phone')}
							/>
							<FormSelect
								control={form.control}
								name="branchId"
								label={t('form.field.branch')}
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
							label={t('form.field.address')}
							placeholder={t('form.field.addressPlaceholder')}
						/>
					</FieldGroup>
				</FormSection>

				{/* GUARDIAN — optional, hidden until the user opts in */}
				{hasGuardian ? (
					<FormSection
						title={t('form.section.guardian')}
						actions={
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={handleRemoveGuardian}
							>
								<X className="mr-1 size-3.5" />
								{t('form.removeGuardian')}
							</Button>
						}
					>
						<FieldGroup>
							<div className="grid grid-cols-2 gap-3">
								<FormInput
									control={form.control}
									name="guardianName"
									label={t('form.field.guardianName')}
									placeholder={t('form.field.guardianNamePlaceholder')}
								/>
								<FormSelect
									control={form.control}
									name="guardianRelation"
									label={t('form.field.relation')}
									options={GUARDIAN_RELATION_OPTIONS.map((o) => ({
										value: o.value,
										label: t(`relation.${o.value}`),
									}))}
								/>
							</div>
							<FormPhoneInput
								control={form.control}
								name="guardianPhone"
								label={t('form.field.guardianPhone')}
							/>
						</FieldGroup>
					</FormSection>
				) : (
					<Button
						type="button"
						variant="outline"
						onClick={() => form.setValue('hasGuardian', true)}
						className="w-full border-dashed"
					>
						<Plus className="mr-1.5 size-4" />
						{t('form.addGuardian')}
					</Button>
				)}

				{/* INITIAL ENROLLMENT — the student bills on the group's course plan. */}
				{groups.length > 0 && (
					<FormSection title={t('form.section.enrollment')}>
						<FieldGroup>
							<FormSelect
								control={form.control}
								name="groupId"
								label={t('form.field.group')}
								valueAsNumber
								options={groups.map((g) => ({
									value: String(g.id),
									label: g.name,
								}))}
							/>
						</FieldGroup>
					</FormSection>
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
	const t = useAppT('people');
	const tv = useT('validation');
	const statusLabel = useStatusLabel();
	const schema = useMemo(() => editStudentSchema(tv), [tv]);

	const form = useForm<EditStudentFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			firstName: student.user.firstName,
			lastName: student.user.lastName,
			dateOfBirth: student.dateOfBirth ?? '',
			gender: student.gender ?? undefined,
			phone: student.user.phone,
			email: student.user.email ?? '',
			branchId: student.branchId,
			address: '',
			status: student.status,
		},
	});

	useEffect(() => {
		form.reset({
			firstName: student.user.firstName,
			lastName: student.user.lastName,
			dateOfBirth: student.dateOfBirth ?? '',
			gender: student.gender ?? undefined,
			phone: student.user.phone,
			email: student.user.email ?? '',
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
			firstName: values.firstName.trim(),
			lastName: values.lastName.trim(),
			phone: values.phone,
			email: values.email ? values.email : null,
			branchId: values.branchId,
			dateOfBirth: values.dateOfBirth || undefined,
			gender: values.gender,
			address: values.address || undefined,
			status: values.status,
		});
		toast.success(t('updated'));
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
				<FormSection title={t('form.section.personal')}>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="firstName"
								label={t('form.field.firstName')}
								placeholder={t('form.field.firstNamePlaceholder')}
							/>
							<FormInput
								control={form.control}
								name="lastName"
								label={t('form.field.lastName')}
								placeholder={t('form.field.lastNamePlaceholder')}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<FormDatePicker
								control={form.control}
								name="dateOfBirth"
								label={t('form.field.dateOfBirth')}
							/>
							<FormSelect
								control={form.control}
								name="gender"
								label={t('form.field.gender')}
								options={GENDER_OPTIONS.map((o) => ({
									value: o.value,
									label: t(`gender.${o.value}`),
								}))}
							/>
						</div>
					</FieldGroup>
				</FormSection>

				{/* CONTACT */}
				<FormSection title={t('form.section.contact')}>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormPhoneInput
								control={form.control}
								name="phone"
								label={t('form.field.phone')}
							/>
							<FormInput
								control={form.control}
								name="email"
								label={t('form.field.email')}
								type="email"
								placeholder={t('form.field.emailPlaceholder')}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="branchId"
								label={t('form.field.branch')}
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
							label={t('form.field.address')}
							placeholder={t('form.field.addressPlaceholder')}
						/>
					</FieldGroup>
				</FormSection>

				{/* STATUS */}
				<FormSection title={t('form.section.status')}>
					<FormSelect
						control={form.control}
						name="status"
						label={t('form.field.studentStatus')}
						options={STUDENT_STATUS_OPTIONS.map((o) => ({
							value: o.value,
							label: statusLabel('student', o.value),
						}))}
					/>
				</FormSection>
			</form>
		</Form>
	);
}

// ─── Sheet wrapper ────────────────────────────────────────────────────────────

export function StudentForm(props: StudentFormProps) {
	const { open, onOpenChange, mode } = props;
	const t = useAppT('people');
	const tc = useT('common');
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-student-form' : 'edit-student-form';

	function handleSuccess() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? t('form.addTitle') : t('form.editTitle')}
			description={t('form.requiredHint')}
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleSuccess}>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						{t('form.save')}
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
