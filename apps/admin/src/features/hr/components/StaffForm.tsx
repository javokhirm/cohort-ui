import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
	toast,
} from '@repo/ui';
import { useStatusLabel, useT } from '@repo/i18n';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { useAppT } from '@/locales';
import { useBranches } from '@/api/branches';
import { useBranchStore } from '@/store/branchStore';

import {
	createStaffSchema,
	parseSpecialization,
	type CreateStaffFormValues,
} from '../schemas/staff-form.schema';
import { useCreateStaff } from '../api/staff.mutations';

interface StaffFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** Values only — labels resolve at render (conventions.md §7). */
const ROLE_OPTIONS = [
	{ value: 'TEACHER' },
	{ value: 'MANAGER' },
	{ value: 'ADMIN' },
] as const;

/** Values only — labels resolve at render (conventions.md §7). */
const EMPLOYMENT_OPTIONS = [
	{ value: 'FULL_TIME' },
	{ value: 'PART_TIME' },
	{ value: 'CONTRACTOR' },
] as const;

function CreateStaffForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('hr');
	const tv = useT('validation');
	const statusLabel = useStatusLabel();
	const schema = useMemo(() => createStaffSchema(tv), [tv]);

	// When exactly one branch is selected globally, pre-fill it (still editable).
	const activeBranchIds = useBranchStore((s) => s.activeBranchIds);
	const defaultBranchId =
		activeBranchIds?.length === 1 ? activeBranchIds[0] : undefined;

	const form = useForm<CreateStaffFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			firstName: '',
			lastName: '',
			roleName: 'TEACHER',
			branchId: defaultBranchId,
			position: '',
			phone: '',
			email: '',
			employmentType: 'FULL_TIME',
			hireDate: '',
			specialization: '',
			password: '',
		},
	});

	const { data: branches = [] } = useBranches();
	const createStaff = useCreateStaff();

	useEffect(() => {
		onPendingChange(createStaff.isPending);
	}, [createStaff.isPending, onPendingChange]);

	async function onSubmit(values: CreateStaffFormValues) {
		await createStaff.mutateAsync({
			branchId: values.branchId,
			firstName: values.firstName.trim(),
			lastName: values.lastName.trim(),
			phone: values.phone,
			email: values.email || undefined,
			position: values.position || undefined,
			roleName: values.roleName,
			employmentType: values.employmentType,
			hireDate: values.hireDate || undefined,
			specialization: parseSpecialization(values.specialization),
			password: values.password || undefined,
		});
		toast.success(t('created'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-staff-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection title={t('form.section.profile')}>
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
							<FormSelect
								control={form.control}
								name="roleName"
								label={t('form.field.role')}
								options={ROLE_OPTIONS.map((o) => ({
									value: o.value,
									label: statusLabel('role', o.value),
								}))}
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
							name="position"
							label={t('form.field.position')}
							placeholder={t('form.field.positionPlaceholder')}
						/>
					</FieldGroup>
				</FormSection>

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
					</FieldGroup>
				</FormSection>

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

				<FormSection title={t('form.section.employment')}>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="employmentType"
								label={t('form.field.contract')}
								options={EMPLOYMENT_OPTIONS.map((o) => ({
									value: o.value,
									label: t(`employment.${o.value}`),
								}))}
							/>
							<FormDatePicker
								control={form.control}
								name="hireDate"
								label={t('form.field.startDate')}
							/>
						</div>
						<FormInput
							control={form.control}
							name="specialization"
							label={t('form.field.specialization')}
							placeholder={t('form.field.specializationPlaceholder')}
						/>
						<p className="text-xs text-muted-foreground">
							{t('form.payHint')}
						</p>
					</FieldGroup>
				</FormSection>
			</form>
		</Form>
	);
}

export function StaffForm({ open, onOpenChange }: StaffFormProps) {
	const t = useAppT('hr');
	const tc = useT('common');
	const [isPending, setIsPending] = useState(false);

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={t('form.addTitle')}
			description={t('form.requiredHint')}
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" form="create-staff-form" disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						{tc('action.save')}
					</Button>
				</>
			}
		>
			<CreateStaffForm onSuccess={handleClose} onPendingChange={setIsPending} />
		</FormSheet>
	);
}
