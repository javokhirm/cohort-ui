import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	FieldGroup,
	Form,
	FormDatePicker,
	FormInput,
	FormPhoneInput,
	FormSelect,
	Spinner,
	toast,
} from '@repo/ui';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
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
			baseSalary: values.baseSalary,
			specialization: parseSpecialization(values.specialization),
			password: values.password || undefined,
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
				<FormSection title="Profile">
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
				</FormSection>

				<FormSection title="Contact">
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
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

				<FormSection title="Access">
					<FieldGroup>
						<FormInput
							control={form.control}
							name="password"
							label="Password"
							type="password"
							autoComplete="new-password"
							placeholder="Min. 8 characters"
						/>
						<p className="text-xs text-muted-foreground">
							They sign in with their phone number and this password. Leave
							blank to set it later.
						</p>
					</FieldGroup>
				</FormSection>

				<FormSection title="Employment">
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormSelect
								control={form.control}
								name="employmentType"
								label="Contract"
								options={EMPLOYMENT_OPTIONS}
							/>
							<FormDatePicker
								control={form.control}
								name="hireDate"
								label="Start date"
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
				</FormSection>
			</form>
		</Form>
	);
}

export function StaffForm({ open, onOpenChange }: StaffFormProps) {
	const [isPending, setIsPending] = useState(false);

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Add staff member"
			description="Fields marked * are required"
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" form="create-staff-form" disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						Save
					</Button>
				</>
			}
		>
			<CreateStaffForm onSuccess={handleClose} onPendingChange={setIsPending} />
		</FormSheet>
	);
}
