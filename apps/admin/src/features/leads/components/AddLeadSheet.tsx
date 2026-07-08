import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { isApiError } from '@repo/api-client';
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
import { useActiveBranchIds } from '@/store/branchStore';
import { useCourseList } from '@/features/courses/api/courses.queries';
import { useStaffList } from '@/features/hr/api/staff.queries';

import { useCreateLead } from '../api/leads.mutations';
import { LEAD_SOURCE_OPTIONS } from '../lib/lead-options';
import {
	blankToUndefined,
	createLeadSchema,
	type CreateLeadFormValues,
} from '../schemas/lead-form.schema';

interface AddLeadSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** Capture a new lead — `POST /manage/leads` (defaults status to NEW). */
export function AddLeadSheet({ open, onOpenChange }: AddLeadSheetProps) {
	const activeBranchIds = useActiveBranchIds();
	const { data: branches = [] } = useBranches();
	const { data: coursesData } = useCourseList({ limit: 100 });
	const { data: staffData } = useStaffList({ limit: 100 });
	const createLead = useCreateLead();

	const form = useForm<CreateLeadFormValues>({
		resolver: zodResolver(createLeadSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			phoneNumber: '+998',
			email: '',
			source: 'INSTAGRAM',
			branchId: activeBranchIds?.length === 1 ? activeBranchIds[0] : undefined,
			courseInterestId: undefined,
			assignedToStaffId: undefined,
			notes: '',
		},
	});

	// The backend requires a branch when the caller has more than one in scope;
	// pre-select the first accessible branch once the list resolves.
	useEffect(() => {
		if (form.getValues('branchId') == null && branches.length > 0) {
			form.setValue('branchId', branches[0].id);
		}
	}, [branches, form]);

	const branchOptions = branches.map((b) => ({ value: String(b.id), label: b.name }));
	const courseOptions = (coursesData?.rows ?? []).map((c) => ({
		value: String(c.id),
		label: c.name,
	}));
	const staffOptions = (staffData?.rows ?? []).map((s) => ({
		value: String(s.id),
		label: `${s.user.firstName} ${s.user.lastName}`,
	}));

	async function onSubmit(values: CreateLeadFormValues) {
		try {
			await createLead.mutateAsync({
				firstName: values.firstName,
				lastName: blankToUndefined(values.lastName),
				phoneNumber: values.phoneNumber,
				email: blankToUndefined(values.email),
				source: values.source,
				branchId: values.branchId,
				courseInterestId: values.courseInterestId,
				assignedToStaffId: values.assignedToStaffId,
			});
			toast.success('Lead captured');
			form.reset();
			onOpenChange(false);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to capture the lead.');
		}
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Add lead"
			description="Fields marked * are required"
			footer={
				<>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="add-lead-form"
						disabled={createLead.isPending}
					>
						{createLead.isPending && <Spinner className="mr-2 size-4" />}
						Add lead
					</Button>
				</>
			}
		>
			<Form {...form}>
				<form
					id="add-lead-form"
					onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
					className="flex flex-col gap-4"
				>
					<div className="flex flex-col gap-4 rounded-xl bg-white p-4">
						<FieldGroup>
							<div className="grid grid-cols-2 gap-3">
								<FormInput
									control={form.control}
									name="firstName"
									label="First name *"
									placeholder="e.g. Sevara"
								/>
								<FormInput
									control={form.control}
									name="lastName"
									label="Last name"
									placeholder="e.g. Mirzayeva"
								/>
							</div>
							<FormInput
								control={form.control}
								name="phoneNumber"
								label="Phone *"
								placeholder="+998901234567"
							/>
							<div className="grid grid-cols-2 gap-3">
								<FormSelect
									control={form.control}
									name="source"
									label="Source"
									options={LEAD_SOURCE_OPTIONS}
								/>
								<FormSelect
									control={form.control}
									name="branchId"
									label="Branch"
									options={branchOptions}
									valueAsNumber
								/>
							</div>
							<FormSelect
								control={form.control}
								name="courseInterestId"
								label="Course interest"
								placeholder="Select a course"
								options={courseOptions}
								valueAsNumber
							/>
							<FormSelect
								control={form.control}
								name="assignedToStaffId"
								label="Assign to"
								placeholder="Assign a staff member"
								options={staffOptions}
								valueAsNumber
							/>
						</FieldGroup>
					</div>
				</form>
			</Form>
		</FormSheet>
	);
}
