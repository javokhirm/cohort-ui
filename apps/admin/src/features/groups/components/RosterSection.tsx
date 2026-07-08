import { useState } from 'react';
import { Pause, Plus, RotateCcw, UserMinus, Users } from 'lucide-react';

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
					Roster{' '}
					<span className="text-muted-foreground">
						· {activeCount}
						{capacity != null ? `/${capacity}` : ''} enrolled
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
							<SelectValue placeholder="All statuses" />
						</SelectTrigger>
						<SelectContent>
							{ENROLLMENT_STATUS_FILTERS.map((f) => (
								<SelectItem
									key={f.value ?? ALL_STATUSES}
									value={f.value ?? ALL_STATUSES}
								>
									{f.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Can permission="enrollment.create">
						<Button size="sm" onClick={() => setEnrollOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							Enroll students
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
						title="No students enrolled"
						description="Enroll active students to build this group's roster."
						action={
							<Can permission="enrollment.create">
								<Button size="sm" onClick={() => setEnrollOpen(true)}>
									<Plus className="mr-1.5 size-4" />
									Enroll students
								</Button>
							</Can>
						}
					/>
				</Card>
			) : visibleEnrollments.length === 0 ? (
				<Card className="px-4 py-6 text-center text-sm text-muted-foreground">
					No enrollments with this status.
				</Card>
			) : (
				<Card className="gap-0 divide-y divide-border py-0">
					{visibleEnrollments.map((e) => {
						const transitions = ENROLLMENT_TRANSITIONS[e.status];
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
										{e.studentCode} · enrolled{' '}
										{formatDate(e.enrolledAt)}
									</span>
								</div>
								<div className="flex items-center gap-3">
									<StatusBadge kind="enrollment" status={e.status} />
									<Can permission="enrollment.update">
										<div className="flex items-center gap-1">
											{transitions.includes('ACTIVE') && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setReactivateTarget(e)}
												>
													<RotateCcw className="mr-1.5 size-3.5" />
													Reactivate
												</Button>
											)}
											{transitions.includes('SUSPENDED') && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setSuspendTarget(e)}
												>
													<Pause className="mr-1.5 size-3.5" />
													Suspend
												</Button>
											)}
											{transitions.includes('DROPPED') && (
												<Button
													variant="ghost"
													size="sm"
													className="text-destructive hover:text-destructive"
													onClick={() => setDropTarget(e)}
												>
													<UserMinus className="mr-1.5 size-3.5" />
													Drop
												</Button>
											)}
										</div>
									</Can>
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
			toast.success('Student dropped from group');
			onClose();
			setReason('');
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Something went wrong');
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
					<DialogTitle>Drop student</DialogTitle>
					<DialogDescription>
						{enrollment
							? `Remove ${enrollment.studentName} from this group.`
							: ''}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-1.5">
					<Label>Reason *</Label>
					<Textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="e.g. Transferred, stopped attending…"
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
						Cancel
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
						Drop student
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
	const updateEnrollment = useUpdateEnrollment();

	async function onSuspend() {
		if (!enrollment) return;
		try {
			await updateEnrollment.mutateAsync({
				id: enrollment.id,
				groupId,
				status: 'SUSPENDED',
			});
			toast.success('Enrollment suspended');
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Something went wrong');
		}
	}

	return (
		<ConfirmDialog
			open={enrollment != null}
			onOpenChange={(o) => !o && onClose()}
			title="Suspend this enrollment?"
			description={
				enrollment
					? `${enrollment.studentName} keeps their seat while suspended — it still counts against group capacity and blocks re-enrolling.`
					: ''
			}
			confirmLabel="Suspend"
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
	const updateEnrollment = useUpdateEnrollment();

	async function onReactivate() {
		if (!enrollment) return;
		try {
			await updateEnrollment.mutateAsync({
				id: enrollment.id,
				groupId,
				status: 'ACTIVE',
			});
			toast.success('Enrollment reactivated');
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Something went wrong');
		}
	}

	return (
		<ConfirmDialog
			open={enrollment != null}
			onOpenChange={(o) => !o && onClose()}
			title="Reactivate this enrollment?"
			description={
				enrollment ? `Restore ${enrollment.studentName} to active status.` : ''
			}
			confirmLabel="Reactivate"
			loading={updateEnrollment.isPending}
			onConfirm={() => void onReactivate()}
		/>
	);
}
