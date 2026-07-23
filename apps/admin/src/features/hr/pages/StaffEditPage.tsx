import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';

import {
	Button,
	FieldGroup,
	Form,
	FormInput,
	FormPhoneInput,
	FormSelect,
	Input,
	Label,
	PageHeader,
	Skeleton,
	Spinner,
	toast,
} from '@repo/ui';
import { formatDate } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';

import { FormSection } from '@/components/FormSection';
import { useAppT } from '@/locales';

import { useStaffMember, type StaffResponse } from '../api/staff.queries';
import { useUpdateStaff } from '../api/staff.mutations';
import {
	editStaffSchema,
	parseSpecialization,
	type EditStaffFormValues,
} from '../schemas/staff-form.schema';

/** Values only — labels resolve at render (conventions.md §7). */
const EMPLOYMENT_OPTIONS = [
	{ value: 'FULL_TIME' },
	{ value: 'PART_TIME' },
	{ value: 'CONTRACTOR' },
] as const;

const STATUS_OPTIONS = [
	{ value: 'ACTIVE' },
	{ value: 'ON_LEAVE' },
	{ value: 'TERMINATED' },
] as const;

/**
 * A labelled, non-editable value. `hireDate` is not accepted by
 * `PATCH /manage/staff/:id`, so it is shown for context but cannot be changed
 * here.
 */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<Label className="text-muted-foreground">{label}</Label>
			<Input defaultValue={value} disabled />
		</div>
	);
}

function EditStaffForm({
	staff,
	onSuccess,
	onPendingChange,
}: {
	staff: StaffResponse;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const toDefaults = (s: StaffResponse): EditStaffFormValues => ({
		firstName: s.user.firstName,
		lastName: s.user.lastName,
		phone: s.user.phone,
		email: s.user.email ?? '',
		position: s.position ?? '',
		employmentType: s.employmentType,
		specialization: s.specialization.join(', '),
		status: s.status,
	});

	const t = useAppT('hr');
	const tv = useT('validation');
	const statusLabel = useStatusLabel();
	const schema = useMemo(() => editStaffSchema(tv), [tv]);

	const form = useForm<EditStaffFormValues>({
		resolver: zodResolver(schema),
		defaultValues: toDefaults(staff),
	});

	useEffect(() => {
		form.reset(toDefaults(staff));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [staff]);

	const updateStaff = useUpdateStaff();

	useEffect(() => {
		onPendingChange(updateStaff.isPending);
	}, [updateStaff.isPending, onPendingChange]);

	async function onSubmit(values: EditStaffFormValues) {
		await updateStaff.mutateAsync({
			id: staff.id,
			firstName: values.firstName.trim(),
			lastName: values.lastName.trim(),
			phone: values.phone,
			email: values.email ? values.email : null,
			position: values.position || undefined,
			employmentType: values.employmentType,
			specialization: parseSpecialization(values.specialization),
			status: values.status,
		});
		toast.success(t('updated'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-staff-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection
					title={t('form.section.profile')}
					className="border border-border bg-card p-5 shadow-xs"
				>
					<FieldGroup>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
						<FormInput
							control={form.control}
							name="position"
							label={t('form.field.position')}
							placeholder={t('form.field.positionPlaceholder')}
						/>
					</FieldGroup>
				</FormSection>

				<FormSection
					title={t('form.section.contact')}
					className="border border-border bg-card p-5 shadow-xs"
				>
					<FieldGroup>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

				<FormSection
					title={t('form.section.employment')}
					className="border border-border bg-card p-5 shadow-xs"
				>
					<FieldGroup>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<FormInput
								control={form.control}
								name="specialization"
								label={t('form.field.specialization')}
								placeholder={t('form.field.specializationPlaceholder')}
							/>
							<FormSelect
								control={form.control}
								name="employmentType"
								label={t('form.field.contract')}
								options={EMPLOYMENT_OPTIONS.map((o) => ({
									value: o.value,
									label: t(`employment.${o.value}`),
								}))}
							/>
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<ReadOnlyField
								label={t('form.field.startDate')}
								value={staff.hireDate ? formatDate(staff.hireDate) : '—'}
							/>
							<FormSelect
								control={form.control}
								name="status"
								label={t('form.field.status')}
								options={STATUS_OPTIONS.map((o) => ({
									value: o.value,
									label: statusLabel('staff', o.value),
								}))}
							/>
						</div>
					</FieldGroup>
				</FormSection>
			</form>
		</Form>
	);
}

interface StaffEditPageProps {
	staffId: number;
}

export function StaffEditPage({ staffId }: StaffEditPageProps) {
	const t = useAppT('hr');
	const tc = useT('common');
	const navigate = useNavigate();
	const { data: staff, isLoading, isError } = useStaffMember(staffId);
	const [isPending, setIsPending] = useState(false);

	function goToDetail() {
		void navigate({
			to: '/staff/$staffId',
			params: { staffId: String(staffId) },
		});
	}

	const backLink = (
		<Link
			to="/staff"
			className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft className="size-3.5" />
			{t('detail.back')}
		</Link>
	);

	if (isLoading) {
		return (
			<div className="mx-auto flex max-w-3xl flex-col gap-5">
				{backLink}
				<div className="flex flex-col gap-2">
					<Skeleton className="h-7 w-48" />
					<Skeleton className="h-4 w-56" />
				</div>
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	if (isError || !staff) {
		return (
			<div className="mx-auto flex max-w-3xl flex-col gap-5">
				{backLink}
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					{t('detail.notFound')}
				</div>
			</div>
		);
	}

	const fullName = `${staff.user.firstName} ${staff.user.lastName}`.trim();

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-5">
			{backLink}
			<PageHeader title={t('form.editTitle')} description={fullName} />

			<EditStaffForm
				staff={staff}
				onSuccess={goToDetail}
				onPendingChange={setIsPending}
			/>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={goToDetail}>
					{tc('action.cancel')}
				</Button>
				<Button type="submit" form="edit-staff-form" disabled={isPending}>
					{isPending && <Spinner className="mr-2 size-4" />}
					{tc('action.save')}
				</Button>
			</div>
		</div>
	);
}
