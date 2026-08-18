import { useState } from 'react';
import { MoreHorizontal, Pause, Plus, RotateCcw, UserMinus, Users } from 'lucide-react';

import {
	Button,
	Card,
	ConfirmDialog,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	EmptyState,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Spinner,
	StatusBadge,
	Textarea,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatDate } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { Can } from '@/components/Can';
import {
	useGroupEnrollments,
	type Enrollment,
	type EnrollmentStatus,
} from '../api/groups.queries';
import { useUpdateEnrollment } from '../api/groups.mutations';
import { ENROLLMENT_STATUS_FILTERS, ENROLLMENT_TRANSITIONS } from '../lib/group-options';
import { EnrollStudentsDialog } from './EnrollStudentsDialog';

const ALL_STATUSES = 'all';

interface RosterSectionProps {
	groupId: number;
	capacity: number | null;
}

export function RosterSection({ groupId, capacity }: RosterSectionProps) {
	const t = useAppT('groups');
	const tc = useT('common');
	const statusLabel = useStatusLabel();
	const { data: enrollments = [], isLoading } = useGroupEnrollments(groupId);
	const [enrollOpen, setEnrollOpen] = useState(false);
	const [dropTarget, setDropTarget] = useState<Enrollment | null>(null);
	const [suspendTarget, setSuspendTarget] = useState<Enrollment | null>(null);
	const [reactivateTarget, setReactivateTarget] = useState<Enrollment | null>(null);
	const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | undefined>(
		undefined,
	);

	// A SUSPENDED enrollment keeps its seat — it still counts against capacity and
	// blocks re-enrolling the same student, so it counts as "occupied" alongside ACTIVE.
	const occupiesSeat = (e: Enrollment) =>
		e.status === 'ACTIVE' || e.status === 'SUSPENDED';
	const activeCount = enrollments.filter(occupiesSeat).length;
	const enrolledIds = enrollments.filter(occupiesSeat).map((e) => e.studentId);
	const visibleEnrollments = statusFilter
		? enrollments.filter((e) => e.status === statusFilter)
		: enrollments;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold">
					{t('roster.title')}{' '}
					<span className="text-muted-foreground">
						·{' '}
						{t('roster.enrolledSummary', {
							filled:
								capacity != null
									? `${activeCount}/${capacity}`
									: activeCount,
						})}
					</span>
				</h2>
				<div className="flex items-center gap-2">
					<Select
						value={statusFilter ?? ALL_STATUSES}
						onValueChange={(v) =>
							setStatusFilter(
								v === ALL_STATUSES ? undefined : (v as EnrollmentStatus),
							)
						}
					>
						<SelectTrigger className="h-9 w-36" size="sm">
							<SelectValue placeholder={t('allStatuses')} />
						</SelectTrigger>
						<SelectContent>
							{ENROLLMENT_STATUS_FILTERS.map((f) => (
								<SelectItem
									key={f.value ?? ALL_STATUSES}
									value={f.value ?? ALL_STATUSES}
								>
									{f.value
										? t(`enrollmentStatus.${f.value}`)
										: tc('state.all')}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Can permission="enrollment.create">
						<Button size="sm" onClick={() => setEnrollOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							{t('roster.enroll')}
						</Button>
					</Can>
				</div>
			</div>

			{isLoading ? (
				<Card className="gap-0 divide-y divide-border py-0">
					{[1, 2, 3].map((i) => (
						<div key={i} className="px-4 py-3.5">
							<Skeleton className="h-9 w-full" />
						</div>
					))}
				</Card>
			) : enrollments.length === 0 ? (
				<Card className="py-0">
					<EmptyState
						icon={<Users />}
						title={t('roster.emptyTitle')}
						description={t('roster.enrollDescription')}
						action={
							<Can permission="enrollment.create">
								<Button size="sm" onClick={() => setEnrollOpen(true)}>
									<Plus className="mr-1.5 size-4" />
									{t('roster.enroll')}
								</Button>
							</Can>
						}
					/>
				</Card>
			) : visibleEnrollments.length === 0 ? (
				<Card className="px-4 py-6 text-center text-sm text-muted-foreground">
					{t('roster.emptyFiltered')}
				</Card>
			) : (
				<Card className="gap-0 divide-y divide-border py-0">
					{visibleEnrollments.map((e) => {
						const transitions = ENROLLMENT_TRANSITIONS[e.status];
						const canReactivate = transitions.includes('ACTIVE');
						const canSuspend = transitions.includes('SUSPENDED');
						const canDrop = transitions.includes('DROPPED');
						const hasActions = canReactivate || canSuspend || canDrop;
						return (
							<div
								key={e.id}
								className="flex items-center justify-between gap-4 px-4 py-3"
							>
								<div className="flex flex-col">
									<span className="text-sm font-medium">
										{e.studentName}
									</span>
									<span className="font-mono text-xs text-muted-foreground">
										{e.studentCode} ·{' '}
										{t('roster.enrolledOn', {
											date: formatDate(e.enrolledAt),
										})}
									</span>
								</div>
								<div className="flex items-center gap-3">
									<StatusBadge kind="enrollment" status={e.status}>
										{statusLabel('enrollment', e.status)}
									</StatusBadge>
									{hasActions && (
										<Can permission="enrollment.update">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="size-8 p-0"
														aria-label={t(
															'roster.rowActionsAria',
														)}
													>
														<MoreHorizontal className="size-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													{canReactivate && (
														<DropdownMenuItem
															onClick={() =>
																setReactivateTarget(e)
															}
														>
															<RotateCcw />
															{t('actions.reactivate')}
														</DropdownMenuItem>
													)}
													{canSuspend && (
														<DropdownMenuItem
															onClick={() =>
																setSuspendTarget(e)
															}
														>
															<Pause />
															{t('actions.suspend')}
														</DropdownMenuItem>
													)}
													{canDrop && (
														<DropdownMenuItem
															variant="destructive"
															onClick={() =>
																setDropTarget(e)
															}
														>
															<UserMinus />
															{t('actions.drop')}
														</DropdownMenuItem>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</Can>
									)}
								</div>
							</div>
						);
					})}
				</Card>
			)}

			<EnrollStudentsDialog
				groupId={groupId}
				open={enrollOpen}
				onOpenChange={setEnrollOpen}
				enrolledStudentIds={enrolledIds}
			/>

			<DropStudentDialog
				groupId={groupId}
				enrollment={dropTarget}
				onClose={() => setDropTarget(null)}
			/>

			<SuspendStudentDialog
				groupId={groupId}
				enrollment={suspendTarget}
				onClose={() => setSuspendTarget(null)}
			/>

			<ReactivateStudentDialog
				groupId={groupId}
				enrollment={reactivateTarget}
				onClose={() => setReactivateTarget(null)}
			/>
		</div>
	);
}

// ─── Drop dialog (requires a reason) ──────────────────────────────────────────

function DropStudentDialog({
	groupId,
	enrollment,
	onClose,
}: {
	groupId: number;
	enrollment: Enrollment | null;
	onClose: () => void;
}) {
	const t = useAppT('groups');
	const tc = useT('common');
	const [reason, setReason] = useState('');
	const updateEnrollment = useUpdateEnrollment();

	async function onDrop() {
		if (!enrollment) return;
		try {
			await updateEnrollment.mutateAsync({
				id: enrollment.id,
				groupId,
				status: 'DROPPED',
				dropReason: reason.trim(),
			});
			toast.success(t('roster.dropped'));
			onClose();
			setReason('');
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tc('error.unknown'));
		}
	}

	return (
		<Dialog
			open={enrollment != null}
			onOpenChange={(o) => {
				if (!o) {
					onClose();
					setReason('');
				}
			}}
		>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{t('roster.drop')}</DialogTitle>
					<DialogDescription>
						{enrollment
							? t('roster.dropDescription', {
									name: enrollment.studentName,
								})
							: ''}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-1.5">
					<Label>{t('roster.dropReason')}</Label>
					<Textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder={t('roster.dropPlaceholder')}
						rows={3}
					/>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => {
							onClose();
							setReason('');
						}}
						disabled={updateEnrollment.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button
						variant="destructive"
						onClick={() => void onDrop()}
						disabled={
							reason.trim().length === 0 || updateEnrollment.isPending
						}
					>
						{updateEnrollment.isPending && (
							<Spinner className="mr-2 size-4" />
						)}
						{t('roster.drop')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Suspend / reactivate dialogs (no reason required) ────────────────────────

function SuspendStudentDialog({
	groupId,
	enrollment,
	onClose,
}: {
	groupId: number;
	enrollment: Enrollment | null;
	onClose: () => void;
}) {
	const t = useAppT('groups');
	const tc = useT('common');
	const updateEnrollment = useUpdateEnrollment();

	async function onSuspend() {
		if (!enrollment) return;
		try {
			await updateEnrollment.mutateAsync({
				id: enrollment.id,
				groupId,
				status: 'SUSPENDED',
			});
			toast.success(t('roster.suspend.done'));
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tc('error.unknown'));
		}
	}

	return (
		<ConfirmDialog
			open={enrollment != null}
			onOpenChange={(o) => !o && onClose()}
			title={t('roster.suspend.title')}
			description={
				enrollment
					? t('roster.suspendDescription', {
							name: enrollment.studentName,
						})
					: ''
			}
			confirmLabel={t('roster.suspend.confirm')}
			loading={updateEnrollment.isPending}
			onConfirm={() => void onSuspend()}
		/>
	);
}

function ReactivateStudentDialog({
	groupId,
	enrollment,
	onClose,
}: {
	groupId: number;
	enrollment: Enrollment | null;
	onClose: () => void;
}) {
	const t = useAppT('groups');
	const tc = useT('common');
	const updateEnrollment = useUpdateEnrollment();

	async function onReactivate() {
		if (!enrollment) return;
		try {
			await updateEnrollment.mutateAsync({
				id: enrollment.id,
				groupId,
				status: 'ACTIVE',
			});
			toast.success(t('roster.reactivate.done'));
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tc('error.unknown'));
		}
	}

	return (
		<ConfirmDialog
			open={enrollment != null}
			onOpenChange={(o) => !o && onClose()}
			title={t('roster.reactivate.title')}
			description={
				enrollment
					? t('roster.reactivateDescription', {
							name: enrollment.studentName,
						})
					: ''
			}
			confirmLabel={t('roster.reactivate.confirm')}
			loading={updateEnrollment.isPending}
			onConfirm={() => void onReactivate()}
		/>
	);
}
