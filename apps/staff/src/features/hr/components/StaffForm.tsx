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
import { useBranchStore } from '@/store/branchStore';

import {
	createStaffSchema,
	editStaffSchema,
	parseSpecialization,
	type CreateStaffFormValues,
	type EditStaffFormValues,
} from '../schemas/staff-form.schema';
import type { StaffResponse } from '../api/staff.queries';
import { useCreateStaff, useUpdateStaff } from '../api/staff.mutations';

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	staff: StaffResponse;
}

type StaffFormProps = CreateProps | EditProps;

const ROLE_OPTIONS = [
	{ value: 'TEACHER', label: 'Teacher' },
	{ value: 'MANAGER', label: 'Manager' },
	{ value: 'ADMIN', label: 'Admin' },
];

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

function CreateStaffForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	// When exactly one branch is selected globally, pre-fill it (still editable).
	const activeBranchIds = useBranchStore((s) => s.activeBranchIds);
	const defaultBranchId =
		activeBranchIds?.length === 1 ? activeBranchIds[0] : undefined;

	const form = useForm<CreateStaffFormValues>({
		resolver: zodResolver(createStaffSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			roleName: 'TEACHER',
			branchId: defaultBranchId,
			position: '',
			phone: '+998',
			email: '',
			employmentType: 'FULL_TIME',
			hireDate: '',
			specialization: '',
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
			baseSalary: values.baseSalary,
			specialization: parseSpecialization(values.specialization),
		});
		toast.success('Staff member added');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-staff-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<Section heading="Profile">
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
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
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="roleName"
								label="Role *"
								options={ROLE_OPTIONS}
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
							name="position"
							label="Position title"
							placeholder="e.g. Senior IELTS Teacher"
						/>
					</FieldGroup>
				</Section>

				<Section heading="Contact">
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="phone"
								label="Phone *"
								placeholder="+998"
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
				</Section>

				<Section heading="Employment">
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="employmentType"
								label="Contract"
								options={EMPLOYMENT_OPTIONS}
							/>
							<FormInput
								control={form.control}
								name="hireDate"
								label="Start date"
								type="date"
							/>
						</div>
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
						<FormInput
							control={form.control}
							name="specialization"
							label="Subjects / specialization"
							placeholder="e.g. IELTS, General English"
						/>
					</FieldGroup>
				</Section>
			</form>
		</Form>
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
		branchId: s.branchId,
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

	const { data: branches = [] } = useBranches();
	const updateStaff = useUpdateStaff();

	useEffect(() => {
		onPendingChange(updateStaff.isPending);
	}, [updateStaff.isPending, onPendingChange]);

	async function onSubmit(values: EditStaffFormValues) {
		await updateStaff.mutateAsync({
			id: staff.id,
			branchId: values.branchId,
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
				<Section heading="Profile">
					<FieldGroup>
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
						<FormInput
							control={form.control}
							name="position"
							label="Position title"
							placeholder="e.g. Senior IELTS Teacher"
						/>
					</FieldGroup>
				</Section>

				<Section heading="Employment">
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
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
						<FormInput
							control={form.control}
							name="specialization"
							label="Subjects / specialization"
							placeholder="e.g. IELTS, General English"
						/>
					</FieldGroup>
				</Section>
			</form>
		</Form>
	);
}

export function StaffForm(props: StaffFormProps) {
	const { open, onOpenChange, mode } = props;
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-staff-form' : 'edit-staff-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? 'Add staff member' : 'Edit staff member'}
			description="Fields marked * are required"
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						Save
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreateStaffForm onSuccess={handleClose} onPendingChange={setIsPending} />
			) : (
				<EditStaffForm
					staff={(props as EditProps).staff}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
