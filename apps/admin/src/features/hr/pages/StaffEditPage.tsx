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

/**
 * A labelled, non-editable value. Name, contact and start date live on the user
 * record and are not accepted by `PATCH /manage/staff/:id`, so they are shown
 * for context but cannot be changed here.
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
		position: s.position ?? '',
		employmentType: s.employmentType,
		baseSalary: s.baseSalary ?? undefined,
		specialization: s.specialization.join(', '),
		status: s.status,
	});

	const form = useForm<EditStaffFormValues>({
		resolver: zodResolver(editStaffSchema),
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

	const fullName = `${staff.user.firstName} ${staff.user.lastName}`.trim();

	async function onSubmit(values: EditStaffFormValues) {
		await updateStaff.mutateAsync({
			id: staff.id,
			position: values.position || undefined,
			employmentType: values.employmentType,
			baseSalary: values.baseSalary,
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
						<ReadOnlyField label="Full name" value={fullName} />
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
							<ReadOnlyField label="Phone" value={staff.user.phone} />
							<ReadOnlyField
								label="Email"
								value={staff.user.email ?? '—'}
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
							<FormSelect
								control={form.control}
								name="employmentType"
								label="Contract"
								options={EMPLOYMENT_OPTIONS}
							/>
							<FormSelect
								control={form.control}
								name="status"
								label="Status"
								options={STATUS_OPTIONS}
							/>
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<ReadOnlyField
								label="Start date"
								value={staff.hireDate ? formatDate(staff.hireDate) : '—'}
							/>
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
						</div>
						<FormInput
							control={form.control}
							name="specialization"
							label="Subjects / specialization"
							placeholder="e.g. IELTS, General English"
						/>
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
