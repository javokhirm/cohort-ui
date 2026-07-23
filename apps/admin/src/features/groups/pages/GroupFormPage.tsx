import { useEffect, useState } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import {
	Button,
	ConfirmDialog,
	FieldGroup,
	FormDatePicker,
	FormInput,
	FormSelect,
	PageHeader,
	Spinner,
	toast,
	type SelectOption,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { type Translator, useT } from '@repo/i18n';

import { useAppT } from '@/locales';

import { useBranches } from '@/api/branches';
import { FormSection } from '@/components/FormSection';
import { useBranchStore } from '@/store/branchStore';
import { useCourseList } from '@/features/courses/api/courses.queries';
import { useStaffList } from '@/features/hr/api/staff.queries';
import { useRoomList } from '@/features/rooms/api/rooms.queries';

import type { GroupDetail } from '../api/groups.queries';
import { useCreateGroup, useUpdateGroup } from '../api/groups.mutations';
import { GROUP_STATUS_OPTIONS, type GroupsT } from '../lib/group-options';
import { describeScheduleConflict } from '../lib/schedule-conflict';
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
import { ScheduleRuleFields } from '../components/ScheduleRuleFields';
import { GradingScaleFields } from '../components/GradingScaleFields';
import { GradingScaleSection } from '../components/GradingScaleSection';
import { SessionPreviewCard } from '../components/SessionPreviewCard';

// ─── Option hooks ────────────────────────────────────────────────────────────

/** Pickers for the group form. Rooms narrow to the chosen branch. */
function useGroupFormOptions(branchId: string) {
	const t = useAppT('groups');
	const { data: branches = [] } = useBranches();
	const { data: courseData } = useCourseList({ limit: 100, isActive: true });
	const { data: teacherData } = useStaffList({ role: 'TEACHER', limit: 100 });
	const branchNum = branchId && branchId !== '' ? Number(branchId) : undefined;
	const { data: roomData } = useRoomList({
		limit: 100,
		branchIds: branchNum ? [branchNum] : undefined,
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
		{ value: NONE_VALUE, label: t('unassigned') },
		...(teacherData?.rows ?? []).map((t) => ({
			value: String(t.id),
			label: `${t.user.firstName} ${t.user.lastName}`.trim(),
		})),
	];
	const roomOptions: SelectOption[] = [
		{ value: NONE_VALUE, label: t('noRoom') },
		...(roomData?.rows ?? []).map((r) => ({
			value: String(r.id),
			label: r.name,
		})),
	];

	return { branchOptions, courseOptions, teacherOptions, roomOptions };
}

// ─── Shared field layout (used by create + edit via FormProvider) ─────────────

function GroupFields({
	mode,
	gradingSection,
	extraSection,
}: {
	mode: 'create' | 'edit';
	/** The grading-scale editor. On create it's part of this form
	 * (`GradingScaleFields`, submitted as `gradingConfig`); on edit it's a
	 * self-contained section wired to the separate, immutable grading-config
	 * endpoint — injected by the caller, which has the group id. */
	gradingSection?: React.ReactNode;
	/** Edit-only sections (e.g. Status) that need `EditGroupFormValues`'s wider
	 * field set — injected by the caller so this component can stay on the
	 * shared `CreateGroupFormValues` shape. */
	extraSection?: React.ReactNode;
}) {
	const t = useAppT('groups');
	const form = useFormContext<CreateGroupFormValues>();
	const branchId = form.watch('branchId');
	const days = form.watch('days');
	const startDate = form.watch('startDate');
	const endDate = form.watch('endDate');
	const startTime = form.watch('startTime');
	const { branchOptions, courseOptions, teacherOptions, roomOptions } =
		useGroupFormOptions(branchId);

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] lg:items-start">
			<div className="flex flex-col gap-4">
				<FormSection
					title={t('form.section.details')}
					className="border border-border bg-card shadow-xs"
				>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label={t('form.field.name')}
							placeholder={t('form.field.namePlaceholder')}
						/>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.5fr)]">
							<FormSelect
								control={form.control}
								name="teacherId"
								label={t('form.field.teacher')}
								options={teacherOptions}
							/>
							<FormSelect
								control={form.control}
								name="roomId"
								label={t('form.field.room')}
								options={roomOptions}
							/>
							<FormInput
								control={form.control}
								name="capacity"
								label={t('form.field.capacity')}
								type="number"
								min={1}
								placeholder={t('form.field.capacityPlaceholder')}
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
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<FormSelect
								control={form.control}
								name="branchId"
								label={t('form.field.branch')}
								placeholder={t('form.field.branchPlaceholder')}
								options={branchOptions}
								disabled={mode === 'edit'}
							/>
							<FormSelect
								control={form.control}
								name="courseId"
								label={t('form.field.course')}
								placeholder={t('form.field.coursePlaceholder')}
								options={courseOptions}
								disabled={mode === 'edit'}
							/>
						</div>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<FormDatePicker
								control={form.control}
								name="startDate"
								label={t('form.field.startDate')}
							/>
							<FormDatePicker
								control={form.control}
								name="endDate"
								label={t('form.field.endDate')}
							/>
						</div>
					</FieldGroup>
				</FormSection>

				<FormSection
					title={t('form.section.scheduleRule')}
					className="border border-border bg-card shadow-xs"
				>
					<ScheduleRuleFields />
				</FormSection>

				{mode === 'create' ? (
					<FormSection
						title={t('form.section.gradingScale')}
						className="border border-border bg-card shadow-xs"
					>
						<GradingScaleFields />
					</FormSection>
				) : (
					gradingSection
				)}

				{extraSection}
			</div>

			<SessionPreviewCard
				days={days}
				startDate={startDate}
				endDate={endDate}
				startTime={startTime}
			/>
		</div>
	);
}

/**
 * Turn a failed create/update into a toast. A room/teacher double-booking (409)
 * gets a specific "scheduling conflict" message naming the occupied slot so the
 * user can fix the room/time; every other error falls back to the server message.
 */
function notifyGroupMutationError(t: GroupsT, tc: Translator<'common'>, err: unknown) {
	const conflict = describeScheduleConflict(err);
	if (conflict) {
		toast.error(t('sessions.conflict'), { description: conflict });
	} else if (isApiError(err)) {
		toast.error(err.message);
	} else {
		toast.error(tc('error.unknown'));
	}
}

// ─── Create ──────────────────────────────────────────────────────────────────

function CreateGroupForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: (groupId: number) => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('groups');
	const tc = useT('common');
	// When exactly one branch is selected globally, pre-fill it (still editable).
	const activeBranchIds = useBranchStore((s) => s.activeBranchIds);
	const defaultBranchId =
		activeBranchIds?.length === 1 ? String(activeBranchIds[0]) : '';

	const form = useForm<CreateGroupFormValues>({
		resolver: zodResolver(createGroupSchema),
		defaultValues: {
			name: '',
			branchId: defaultBranchId,
			courseId: '',
			teacherId: NONE_VALUE,
			roomId: NONE_VALUE,
			capacity: undefined,
			startDate: '',
			endDate: '',
			days: [],
			startTime: '09:00',
			endTime: '10:30',
			gradingType: 'POINTS',
			gradingMaxPoints: '10',
			gradingAllowHalf: false,
		},
	});

	const createGroup = useCreateGroup();

	useEffect(() => {
		onPendingChange(createGroup.isPending);
	}, [createGroup.isPending, onPendingChange]);

	async function onSubmit(values: CreateGroupFormValues) {
		let created: GroupDetail;
		try {
			created = await createGroup.mutateAsync(createValuesToPayload(values));
		} catch (err) {
			notifyGroupMutationError(t, tc, err);
			return;
		}
		toast.success(t('created'));
		onSuccess(created.id);
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
	onSuccess: (groupId: number) => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('groups');
	const tc = useT('common');
	const form = useForm<EditGroupFormValues>({
		resolver: zodResolver(editGroupSchema),
		defaultValues: groupToFormValues(group),
	});

	useEffect(() => {
		form.reset(groupToFormValues(group));
	}, [group]);

	const updateGroup = useUpdateGroup();

	useEffect(() => {
		onPendingChange(updateGroup.isPending);
	}, [updateGroup.isPending, onPendingChange]);

	// Validated values held back while the reschedule modal is open; `null` when
	// no confirmation is pending.
	const [pendingReschedule, setPendingReschedule] =
		useState<EditGroupFormValues | null>(null);

	async function submitUpdate(values: EditGroupFormValues) {
		try {
			await updateGroup.mutateAsync(editValuesToPayload(group.id, values));
		} catch (err) {
			// Regenerating the schedule can also collide with another group's room.
			notifyGroupMutationError(t, tc, err);
			setPendingReschedule(null);
			return;
		}
		toast.success(t('updated'));
		onSuccess(group.id);
	}

	function onSubmit(values: EditGroupFormValues) {
		// Editing anything beyond name/status/capacity reschedules the group's
		// sessions — confirm before we drop existing future sessions.
		if (rescheduleFieldsChanged(group, values)) {
			setPendingReschedule(values);
			return;
		}
		void submitUpdate(values);
	}

	return (
		<FormProvider {...form}>
			<form
				id="edit-group-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
			>
				<GroupFields
					mode="edit"
					gradingSection={<GradingScaleSection groupId={group.id} />}
					extraSection={
						<FormSection
							title={t('form.section.status')}
							className="border border-border bg-card shadow-xs"
						>
							<FieldGroup>
								<FormSelect
									control={form.control}
									name="status"
									label={t('form.field.groupStatus')}
									options={GROUP_STATUS_OPTIONS.map((o) => ({
										value: o.value,
										label: t(`status.${o.value}`),
									}))}
								/>
							</FieldGroup>
						</FormSection>
					}
				/>
			</form>

			<ConfirmDialog
				open={pendingReschedule !== null}
				onOpenChange={(open) => {
					if (!open) setPendingReschedule(null);
				}}
				title={t('form.reschedule.title')}
				description={t('form.reschedule.description')}
				confirmLabel={t('form.reschedule.confirm')}
				cancelLabel={t('form.reschedule.cancel')}
				variant="destructive"
				loading={updateGroup.isPending}
				onConfirm={() => {
					if (pendingReschedule) {
						void submitUpdate({
							...pendingReschedule,
							regenerateSessions: true,
						});
					}
				}}
			/>
		</FormProvider>
	);
}

/**
 * True when the edit touches anything that reschedules the group's sessions —
 * i.e. any field other than name, status, or capacity. Branch and course are
 * locked in edit mode and `regenerateSessions` is a control flag, so both are
 * ignored here. Compared against the group's own values in form shape.
 */
function rescheduleFieldsChanged(
	group: GroupDetail,
	values: EditGroupFormValues,
): boolean {
	const before = groupToFormValues(group);
	const sameDays =
		before.days.length === values.days.length &&
		before.days.every((d) => values.days.includes(d));
	return (
		!sameDays ||
		before.teacherId !== values.teacherId ||
		before.roomId !== values.roomId ||
		before.startDate !== values.startDate ||
		before.endDate !== values.endDate ||
		before.startTime !== values.startTime ||
		before.endTime !== values.endTime
	);
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface CreatePageProps {
	mode: 'create';
}

interface EditPageProps {
	mode: 'edit';
	group: GroupDetail;
}

export type GroupFormPageProps = CreatePageProps | EditPageProps;

export function GroupFormPage(props: GroupFormPageProps) {
	const tc = useT('common');
	const t = useAppT('groups');
	const navigate = useNavigate();
	const [isPending, setIsPending] = useState(false);
	const formId = props.mode === 'create' ? 'create-group-form' : 'edit-group-form';

	function goToGroups() {
		void navigate({ to: '/groups' });
	}

	function goToGroup(groupId: number) {
		void navigate({ to: '/groups/$groupId', params: { groupId: String(groupId) } });
	}

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-5">
			<Link
				{...(props.mode === 'create'
					? { to: '/groups' as const }
					: {
							to: '/groups/$groupId' as const,
							params: { groupId: String(props.group.id) },
						})}
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				{props.mode === 'create'
					? t('back')
					: t('backToGroup', { name: props.group.name })}
			</Link>

			<PageHeader title={props.mode === 'create' ? t('create') : t('edit')} />

			{props.mode === 'create' ? (
				<CreateGroupForm onSuccess={goToGroup} onPendingChange={setIsPending} />
			) : (
				<EditGroupForm
					group={props.group}
					onSuccess={goToGroup}
					onPendingChange={setIsPending}
				/>
			)}

			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={
						props.mode === 'create'
							? goToGroups
							: () => goToGroup(props.group.id)
					}
				>
					{tc('action.cancel')}
				</Button>
				<Button type="submit" form={formId} disabled={isPending}>
					{isPending && <Spinner className="mr-2 size-4" />}
					{props.mode === 'create' ? t('create') : t('form.saveChanges')}
				</Button>
			</div>
		</div>
	);
}
