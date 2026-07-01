import { useEffect, useState } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	FieldGroup,
	FormInput,
	FormSelect,
	Spinner,
	toast,
	type SelectOption,
} from '@repo/ui';

import { FormSheet } from '@/components/FormSheet';
import { useBranches } from '@/features/people/api/students.queries';
import { useCourseList } from '@/features/courses/api/courses.queries';
import { useStaffList } from '@/features/hr/api/staff.queries';
import { useRoomList } from '@/features/rooms/api/rooms.queries';

import type { GroupDetail } from '../api/groups.queries';
import { useCreateGroup, useUpdateGroup } from '../api/groups.mutations';
import { GROUP_STATUS_OPTIONS } from '../lib/group-options';
import {
	createGroupSchema,
	createValuesToPayload,
	editGroupSchema,
	editValuesToPayload,
	groupToFormValues,
	NONE_VALUE,
	type CreateGroupFormValues,
	type EditGroupFormValues,
} from '../schemas/group-form.schema';
import { ScheduleRuleFields } from './ScheduleRuleFields';

// ─── Option hooks ────────────────────────────────────────────────────────────

/** Pickers for the group form. Rooms narrow to the chosen branch. */
function useGroupFormOptions(branchId: string) {
	const { data: branches = [] } = useBranches();
	const { data: courseData } = useCourseList({ limit: 100, isActive: true });
	const { data: teacherData } = useStaffList({ role: 'TEACHER', limit: 100 });
	const branchNum = branchId && branchId !== '' ? Number(branchId) : undefined;
	const { data: roomData } = useRoomList({
		limit: 100,
		branchId: branchNum,
		isActive: true,
	});

	const branchOptions: SelectOption[] = branches.map((b) => ({
		value: String(b.id),
		label: b.name,
	}));
	const courseOptions: SelectOption[] = (courseData?.rows ?? []).map((c) => ({
		value: String(c.id),
		label: c.name,
	}));
	const teacherOptions: SelectOption[] = [
		{ value: NONE_VALUE, label: 'Unassigned' },
		...(teacherData?.rows ?? []).map((t) => ({
			value: String(t.id),
			label: `${t.user.firstName} ${t.user.lastName}`.trim(),
		})),
	];
	const roomOptions: SelectOption[] = [
		{ value: NONE_VALUE, label: 'No room' },
		...(roomData?.rows ?? []).map((r) => ({
			value: String(r.id),
			label: r.name,
		})),
	];

	return { branchOptions, courseOptions, teacherOptions, roomOptions };
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-4 rounded-xl bg-white p-4">
			{title && (
				<span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
					{title}
				</span>
			)}
			{children}
		</div>
	);
}

// ─── Shared field layout (used by create + edit via FormProvider) ─────────────

function GroupFields({ mode }: { mode: 'create' | 'edit' }) {
	const form = useFormContext<CreateGroupFormValues>();
	const branchId = form.watch('branchId');
	const { branchOptions, courseOptions, teacherOptions, roomOptions } =
		useGroupFormOptions(branchId);

	return (
		<div className="flex flex-col gap-4">
			<Section title="Basics">
				<FieldGroup>
					<FormInput
						control={form.control}
						name="name"
						label="Group name *"
						placeholder="e.g. IELTS Morning A"
					/>
					<div className="grid grid-cols-2 gap-3">
						<FormSelect
							control={form.control}
							name="branchId"
							label="Branch *"
							placeholder="Select branch"
							options={branchOptions}
							disabled={mode === 'edit'}
						/>
						<FormSelect
							control={form.control}
							name="courseId"
							label="Course *"
							placeholder="Select course"
							options={courseOptions}
							disabled={mode === 'edit'}
						/>
					</div>
				</FieldGroup>
			</Section>

			<Section title="Assignment">
				<FieldGroup>
					<div className="grid grid-cols-2 gap-3">
						<FormSelect
							control={form.control}
							name="teacherId"
							label="Teacher"
							options={teacherOptions}
						/>
						<FormSelect
							control={form.control}
							name="roomId"
							label="Room"
							options={roomOptions}
						/>
					</div>
					<FormInput
						control={form.control}
						name="capacity"
						label="Capacity"
						type="number"
						min={1}
						placeholder="e.g. 15"
						onChange={(e) =>
							form.setValue(
								'capacity',
								e.target.value === ''
									? undefined
									: Number(e.target.value),
								{ shouldValidate: true },
							)
						}
					/>
				</FieldGroup>
			</Section>

			<Section title="Schedule">
				<FieldGroup>
					<div className="grid grid-cols-2 gap-3">
						<FormInput
							control={form.control}
							name="startDate"
							label="Start date"
							type="date"
						/>
						<FormInput
							control={form.control}
							name="endDate"
							label="End date"
							type="date"
						/>
					</div>
					<ScheduleRuleFields />
				</FieldGroup>
			</Section>
		</div>
	);
}

// ─── Create ──────────────────────────────────────────────────────────────────

function CreateGroupForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const form = useForm<CreateGroupFormValues>({
		resolver: zodResolver(createGroupSchema),
		defaultValues: {
			name: '',
			branchId: '',
			courseId: '',
			teacherId: NONE_VALUE,
			roomId: NONE_VALUE,
			capacity: undefined,
			startDate: '',
			endDate: '',
			scheduleEnabled: false,
			days: [],
			startTime: '09:00',
			endTime: '10:30',
		},
	});

	const createGroup = useCreateGroup();

	useEffect(() => {
		onPendingChange(createGroup.isPending);
	}, [createGroup.isPending, onPendingChange]);

	async function onSubmit(values: CreateGroupFormValues) {
		await createGroup.mutateAsync(createValuesToPayload(values));
		toast.success('Group created');
		onSuccess();
	}

	return (
		<FormProvider {...form}>
			<form
				id="create-group-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
			>
				<GroupFields mode="create" />
			</form>
		</FormProvider>
	);
}

// ─── Edit ────────────────────────────────────────────────────────────────────

function EditGroupForm({
	group,
	onSuccess,
	onPendingChange,
}: {
	group: GroupDetail;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const form = useForm<EditGroupFormValues>({
		resolver: zodResolver(editGroupSchema),
		defaultValues: groupToFormValues(group),
	});

	useEffect(() => {
		form.reset(groupToFormValues(group));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [group]);

	const updateGroup = useUpdateGroup();

	useEffect(() => {
		onPendingChange(updateGroup.isPending);
	}, [updateGroup.isPending, onPendingChange]);

	async function onSubmit(values: EditGroupFormValues) {
		await updateGroup.mutateAsync(editValuesToPayload(group.id, values));
		toast.success('Group updated');
		onSuccess();
	}

	return (
		<FormProvider {...form}>
			<form
				id="edit-group-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
			>
				<GroupFields mode="edit" />
				<div className="mt-4">
					<Section title="Status">
						<FieldGroup>
							<FormSelect
								control={form.control}
								name="status"
								label="Group status"
								options={GROUP_STATUS_OPTIONS}
							/>
							<RegenerateToggle />
						</FieldGroup>
					</Section>
				</div>
			</form>
		</FormProvider>
	);
}

/** Only meaningful when a schedule rule is set — offered as an explicit opt-in. */
function RegenerateToggle() {
	const form = useFormContext<EditGroupFormValues>();
	const scheduleEnabled = form.watch('scheduleEnabled');
	if (!scheduleEnabled) return null;
	return (
		<label className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3 text-sm">
			<input
				type="checkbox"
				className="mt-0.5 size-4 accent-primary"
				checked={form.watch('regenerateSessions')}
				onChange={(e) => form.setValue('regenerateSessions', e.target.checked)}
			/>
			<span className="flex flex-col">
				<span className="font-medium">Regenerate future sessions</span>
				<span className="text-xs text-muted-foreground">
					Replaces upcoming scheduled sessions from the new rule. Past sessions
					are kept.
				</span>
			</span>
		</label>
	);
}

// ─── Wrapper ─────────────────────────────────────────────────────────────────

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	group: GroupDetail;
}

export type GroupFormProps = CreateProps | EditProps;

export function GroupForm(props: GroupFormProps) {
	const { open, onOpenChange, mode } = props;
	const [isPending, setIsPending] = useState(false);
	const formId = mode === 'create' ? 'create-group-form' : 'edit-group-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? 'Create group' : 'Edit group'}
			description="Fields marked * are required"
			maxWidth="lg"
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						{mode === 'create' ? 'Create group' : 'Save changes'}
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreateGroupForm onSuccess={handleClose} onPendingChange={setIsPending} />
			) : (
				<EditGroupForm
					group={props.group}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
