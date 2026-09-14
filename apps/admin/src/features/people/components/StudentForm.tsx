import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@repo/api-client';
import { toast } from '@repo/ui';

import {
	Button,
	FieldGroup,
	Form,
	FormDatePicker,
	FormInput,
	FormPasswordInput,
	FormPhoneInput,
	FormSelect,
	Spinner,
} from '@repo/ui';
import { useStatusLabel, useT } from '@repo/i18n';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { BranchSelectField } from '@/components/BranchSelectField';
import { useAppT } from '@/locales';

import {
	createStudentSchema,
	editStudentSchema,
	type CreateStudentFormValues,
	type EditStudentFormValues,
} from '../schemas/student-form.schema';
import { useBranchStore } from '@/store/branchStore';
import { useGroups, useStudentGuardians, type Student } from '../api/students.queries';
import {
	useCreateStudent,
	useUpdateStudent,
	useEnrollStudent,
	useAddGuardian,
	type AddGuardianInput,
} from '../api/students.mutations';
import { buildAddGuardianInput } from '../lib/guardian-input';
import { ConnectedGuardiansSummary } from './ConnectedGuardiansSummary';
import { GuardianPhoneField } from './GuardianPhoneField';

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
			guardianName: '',
			guardianPhone: '',
			guardianRelation: undefined,
			guardianLookupState: 'idle',
			connectedGuardianUserId: undefined,
		},
	});

	const guardianPhone = form.watch('guardianPhone') ?? '';
	const guardianRelation = form.watch('guardianRelation');
	const connectedGuardianUserId = form.watch('connectedGuardianUserId');

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
				phone: values.phone || undefined,
				dateOfBirth: values.dateOfBirth || undefined,
				gender: values.gender,
				address: values.address || undefined,
			});
			studentId = result.id;
		} catch {
			return;
		}

		// The student exists now, so the guardian link can be written. A phone
		// the tenant already knows resolves to that same person server-side, so
		// this never mints a second guardian for a household of siblings.
		if (values.guardianPhone) {
			try {
				await addGuardian.mutateAsync(
					buildAddGuardianInput(studentId, values, { isPrimary: true }),
				);
			} catch (err) {
				// The student is already created — surface the guardian failure
				// instead of failing the whole flow, or the operator would
				// re-submit and hit STUDENT_ALREADY_EXISTS.
				toast.error(
					isApiError(err) ? err.message : t('detail.guardians.addFailed'),
				);
			}
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
							<BranchSelectField
								control={form.control}
								name="branchId"
								label={t('form.field.branch')}
								valueAsNumber
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

				{/* GUARDIAN — driven entirely by the phone: leave it blank and the
				    student is created with no guardian at all. */}
				<FormSection title={t('form.section.guardian')}>
					<GuardianPhoneField
						control={form.control}
						setValue={form.setValue}
						phone={guardianPhone}
						relation={guardianRelation}
						connectedGuardianUserId={connectedGuardianUserId}
						onConnect={(guardianUserId) =>
							// No student to link to yet — record the confirmation
							// and write the link right after the student is created.
							form.setValue('connectedGuardianUserId', guardianUserId, {
								shouldValidate: true,
							})
						}
					/>
				</FormSection>

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
	const schema = useMemo(() => editStudentSchema(tv, t), [tv, t]);

	const form = useForm<EditStudentFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			firstName: student.user.firstName,
			lastName: student.user.lastName,
			dateOfBirth: student.dateOfBirth ?? '',
			gender: student.gender ?? undefined,
			phone: student.user.phone ?? '',
			email: student.user.email ?? '',
			branchId: student.branchId,
			address: '',
			status: student.status,
			password: '',
			guardianName: '',
			guardianPhone: '',
			guardianRelation: undefined,
			guardianLookupState: 'idle',
			connectedGuardianUserId: undefined,
		},
	});

	useEffect(() => {
		form.reset({
			firstName: student.user.firstName,
			lastName: student.user.lastName,
			dateOfBirth: student.dateOfBirth ?? '',
			gender: student.gender ?? undefined,
			phone: student.user.phone ?? '',
			email: student.user.email ?? '',
			branchId: student.branchId,
			address: '',
			status: student.status,
			password: '',
			guardianName: '',
			guardianPhone: '',
			guardianRelation: undefined,
			guardianLookupState: 'idle',
			connectedGuardianUserId: undefined,
		});
	}, [student, form]);

	const guardianPhone = form.watch('guardianPhone') ?? '';
	const guardianRelation = form.watch('guardianRelation');
	const connectedGuardianUserId = form.watch('connectedGuardianUserId');

	// The student's own detail response already carries `guardians`; the query
	// keeps the list live after a connect made from this very form.
	const { data: guardians = student.guardians ?? [] } = useStudentGuardians(student.id);
	const linkedGuardianUserIds = guardians.map((g) => g.guardianUserId);

	const updateStudent = useUpdateStudent();
	const addGuardian = useAddGuardian();

	useEffect(() => {
		onPendingChange(updateStudent.isPending || addGuardian.isPending);
	}, [updateStudent.isPending, addGuardian.isPending, onPendingChange]);

	/**
	 * Link a guardian and report the outcome. Shared by the Connect button (the
	 * student exists, so confirming can link there and then) and by submit (the
	 * new-guardian path, which has nothing to link until the operator saves).
	 */
	async function linkGuardian(input: AddGuardianInput): Promise<boolean> {
		try {
			await addGuardian.mutateAsync(input);
			return true;
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('detail.guardians.addFailed'));
			return false;
		}
	}

	async function handleConnect() {
		const values = form.getValues();
		const linked = await linkGuardian(
			buildAddGuardianInput(student.id, values, {
				isPrimary: guardians.length === 0,
			}),
		);
		if (!linked) return;

		toast.success(t('detail.guardians.added'));
		// The guardian now shows in the connected list above, so clear the field
		form.setValue('guardianPhone', '');
		form.setValue('guardianName', '');
		form.setValue('guardianRelation', undefined);
		form.setValue('connectedGuardianUserId', undefined);
	}

	async function onSubmit(values: EditStudentFormValues) {
		await updateStudent.mutateAsync({
			id: student.id,
			firstName: values.firstName.trim(),
			lastName: values.lastName.trim(),
			phone: values.phone ? values.phone : null,
			email: values.email ? values.email : null,
			branchId: values.branchId,
			dateOfBirth: values.dateOfBirth || undefined,
			gender: values.gender,
			address: values.address || undefined,
			status: values.status,
			password: values.password || undefined,
		});

		// A guardian left in the form is one the operator described but never
		// connected — the new-person path. An existing match is connected by its
		// own button, which clears these fields, so it cannot be re-sent here.
		if (values.guardianPhone && values.connectedGuardianUserId == null) {
			await linkGuardian(
				buildAddGuardianInput(student.id, values, {
					isPrimary: guardians.length === 0,
				}),
			);
		}

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
							<BranchSelectField
								control={form.control}
								name="branchId"
								label={t('form.field.branch')}
								valueAsNumber
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

				{/* GUARDIAN — who is already connected, plus a phone field to
				    connect another without creating a duplicate. */}
				<FormSection title={t('form.section.guardian')}>
					<div className="flex flex-col gap-3">
						<ConnectedGuardiansSummary guardians={guardians} />
						<GuardianPhoneField
							control={form.control}
							setValue={form.setValue}
							phone={guardianPhone}
							relation={guardianRelation}
							connectedGuardianUserId={connectedGuardianUserId}
							connecting={addGuardian.isPending}
							linkedGuardianUserIds={linkedGuardianUserIds}
							onConnect={handleConnect}
						/>
					</div>
				</FormSection>

				{/* ACCESS */}
				<FormSection title={t('form.section.access')}>
					<FieldGroup>
						<FormPasswordInput
							control={form.control}
							name="password"
							label={t('form.field.password')}
							autoComplete="new-password"
							placeholder={t('form.field.passwordPlaceholder')}
						/>
						<p className="text-xs text-muted-foreground">
							{t('form.passwordHint')}
						</p>
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
