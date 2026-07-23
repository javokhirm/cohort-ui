import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { isApiError } from '@repo/api-client';
import {
	Button,
	FieldGroup,
	Form,
	FormInput,
	FormPhoneInput,
	FormSelect,
	Spinner,
	toast,
} from '@repo/ui';
import { useStatusLabel, useT } from '@repo/i18n';

import { FormSheet } from '@/components/FormSheet';
import { BranchSelectField } from '@/components/BranchSelectField';
import { useAppT } from '@/locales';
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
import { FormSection } from '@/components/FormSection';

interface AddLeadSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** Capture a new lead — `POST /manage/leads` (defaults status to NEW). */
export function AddLeadSheet({ open, onOpenChange }: AddLeadSheetProps) {
	const t = useAppT('leads');
	const tc = useT('common');
	const tv = useT('validation');
	const statusLabel = useStatusLabel();
	const schema = useMemo(() => createLeadSchema(tv), [tv]);

	const activeBranchIds = useActiveBranchIds();
	const { data: branches = [] } = useBranches();
	const { data: coursesData } = useCourseList({ limit: 100 });
	const { data: staffData } = useStaffList({ limit: 100 });
	const createLead = useCreateLead();

	const form = useForm<CreateLeadFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			firstName: '',
			lastName: '',
			phoneNumber: '',
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
			toast.success(t('toast.created'));
			form.reset();
			onOpenChange(false);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('toast.createFailed'));
		}
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={t('addSheet.title')}
			description={t('addSheet.requiredHint')}
			footer={
				<>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{tc('action.cancel')}
					</Button>
					<Button
						type="submit"
						form="add-lead-form"
						disabled={createLead.isPending}
					>
						{createLead.isPending && <Spinner className="mr-2 size-4" />}
						{t('addSheet.submit')}
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
					<FormSection>
						<FieldGroup>
							<div className="grid grid-cols-2 gap-3">
								<FormInput
									control={form.control}
									name="firstName"
									label={t('field.firstName')}
									placeholder={t('field.firstNamePlaceholder')}
								/>
								<FormInput
									control={form.control}
									name="lastName"
									label={t('field.lastName')}
									placeholder={t('field.lastNamePlaceholder')}
								/>
							</div>
							<FormPhoneInput
								control={form.control}
								name="phoneNumber"
								label={t('field.phone')}
							/>
							<div className="grid grid-cols-2 gap-3">
								<FormSelect
									control={form.control}
									name="source"
									label={t('field.source')}
									options={LEAD_SOURCE_OPTIONS.map((o) => ({
										value: o.value,
										label: statusLabel('lead_source', o.value),
									}))}
								/>
								<BranchSelectField
									control={form.control}
									name="branchId"
									label={t('field.branch')}
									valueAsNumber
								/>
							</div>
							<FormSelect
								control={form.control}
								name="courseInterestId"
								label={t('field.courseInterest')}
								placeholder={t('field.courseInterestPlaceholder')}
								options={courseOptions}
								valueAsNumber
							/>
							<FormSelect
								control={form.control}
								name="assignedToStaffId"
								label={t('field.assignTo')}
								placeholder={t('field.assignToPlaceholder')}
								options={staffOptions}
								valueAsNumber
							/>
						</FieldGroup>
					</FormSection>
				</form>
			</Form>
		</FormSheet>
	);
}
