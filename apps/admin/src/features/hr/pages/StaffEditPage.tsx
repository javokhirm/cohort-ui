import { useEffect, useState } from 'react';
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

import { FormSection } from '@/components/FormSection';

import { useStaffMember, type StaffResponse } from '../api/staff.queries';
import { useUpdateStaff } from '../api/staff.mutations';
import {
	editStaffSchema,
	parseSpecialization,
	type EditStaffFormValues,
} from '../schemas/staff-form.schema';

const EMPLOYMENT_OPTIONS = [
	{ value: 'FULL_TIME', label: 'Full-time' },
	{ value: 'PART_TIME', label: 'Part-time' },
	{ value: 'CONTRACTOR', label: 'Contractor' },
];

const STATUS_OPTIONS = [
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'ON_LEAVE', label: 'On leave' },
	{ value: 'TERMINATED', label: 'Terminated' },
];

const PAYROLL_TYPE_OPTIONS = [
	{ value: 'FIXED', label: 'Fixed salary' },
	{ value: 'PERCENT', label: '% of student fees' },
];

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
		baseSalary: s.baseSalary ?? undefined,
		payrollType: s.payrollType,
		payrollPercent: s.payrollPercent ?? undefined,
		specialization: s.specialization.join(', '),
		status: s.status,
	});

	const form = useForm<EditStaffFormValues>({
		resolver: zodResolver(editStaffSchema),
		defaultValues: toDefaults(staff),
	});

	// The payroll block is teacher-only; PERCENT swaps the salary input for the
	// percent share of their groups' course fees.
	const isTeacher = staff.roles.includes('TEACHER');
	const payrollType = form.watch('payrollType');
	const showPercent = isTeacher && payrollType === 'PERCENT';

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
			baseSalary: values.baseSalary,
			payrollType: values.payrollType,
			payrollPercent:
				values.payrollType === 'PERCENT' ? values.payrollPercent : undefined,
			specialization: parseSpecialization(values.specialization),
			status: values.status,
		});
		toast.success('Staff member updated');
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
					title="Profile"
					className="border border-border bg-card p-5 shadow-xs"
				>
					<FieldGroup>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<FormInput
								control={form.control}
								name="firstName"
								label="First name *"
								placeholder="e.g. Diyorbek"
							/>
							<FormInput
								control={form.control}
								name="lastName"
								label="Last name *"
								placeholder="e.g. Rustamov"
							/>
						</div>
						<FormInput
							control={form.control}
							name="position"
							label="Position title"
							placeholder="e.g. Senior IELTS Teacher"
						/>
					</FieldGroup>
				</FormSection>

				<FormSection
					title="Contact"
					className="border border-border bg-card p-5 shadow-xs"
				>
					<FieldGroup>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<FormPhoneInput
								control={form.control}
								name="phone"
								label="Phone *"
							/>
							<FormInput
								control={form.control}
								name="email"
								label="Email"
								type="email"
								placeholder="name@center.uz"
							/>
						</div>
					</FieldGroup>
				</FormSection>

				<FormSection
					title="Employment"
					className="border border-border bg-card p-5 shadow-xs"
				>
					<FieldGroup>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<FormInput
								control={form.control}
								name="specialization"
								label="Subjects / specialization"
								placeholder="e.g. IELTS, General English"
							/>
							<FormSelect
								control={form.control}
								name="employmentType"
								label="Contract"
								options={EMPLOYMENT_OPTIONS}
							/>
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<ReadOnlyField
								label="Start date"
								value={staff.hireDate ? formatDate(staff.hireDate) : '—'}
							/>
							<FormSelect
								control={form.control}
								name="status"
								label="Status"
								options={STATUS_OPTIONS}
							/>
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{isTeacher && (
								<FormSelect
									control={form.control}
									name="payrollType"
									label="Pay model"
									options={PAYROLL_TYPE_OPTIONS}
								/>
							)}
							{showPercent ? (
								<>
									<FormInput
										control={form.control}
										name="payrollPercent"
										label="Share of student fees (%)"
										type="number"
										placeholder="e.g. 50"
										onChange={(e) =>
											form.setValue(
												'payrollPercent',
												e.target.value === ''
													? undefined
													: Number(e.target.value),
												{ shouldValidate: true },
											)
										}
									/>
									<p className="text-xs text-muted-foreground">
										The teacher earns this share of the course fees of
										students in their groups, prorated by lessons for
										mid-month joiners and leavers.
									</p>
								</>
							) : (
								<FormInput
									control={form.control}
									name="baseSalary"
									label="Monthly salary (UZS)"
									type="number"
									placeholder="0"
									onChange={(e) =>
										form.setValue(
											'baseSalary',
											e.target.value === ''
												? undefined
												: Number(e.target.value),
											{ shouldValidate: true },
										)
									}
								/>
							)}
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
			Back to staff
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
					Staff member not found.
				</div>
			</div>
		);
	}

	const fullName = `${staff.user.firstName} ${staff.user.lastName}`.trim();

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-5">
			{backLink}
			<PageHeader title="Edit staff member" description={fullName} />

			<EditStaffForm
				staff={staff}
				onSuccess={goToDetail}
				onPendingChange={setIsPending}
			/>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={goToDetail}>
					Cancel
				</Button>
				<Button type="submit" form="edit-staff-form" disabled={isPending}>
					{isPending && <Spinner className="mr-2 size-4" />}
					Save changes
				</Button>
			</div>
		</div>
	);
}
