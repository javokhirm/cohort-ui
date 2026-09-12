import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
	ChevronDown,
	ChevronRight,
	MoreHorizontal,
	Pause,
	Plus,
	RotateCcw,
	UserMinus,
	Users,
} from 'lucide-react';

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
	Separator,
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
import { useGroupEnrollments, type Enrollment } from '../api/groups.queries';
import { useUpdateEnrollment } from '../api/groups.mutations';
import { ENROLLMENT_TRANSITIONS, occupiesSeat } from '../lib/group-options';
import { EnrollStudentsDialog } from './EnrollStudentsDialog';

interface RosterSectionProps {
	groupId: number;
	capacity: number | null;
}

/**
 * The group's students — the screen's landing view, because "who is in this
 * group" is the question it is opened for.
 *
 * Current students (`ACTIVE` + `SUSPENDED` — the ones holding a seat) are the
 * list; the ones who left are collapsed behind one row. That replaces a
 * six-option status dropdown that sat in the section heading: a roster is ~20
 * people, so the only split that earns its place is still-here vs gone.
 */
export function RosterSection({ groupId, capacity }: RosterSectionProps) {
	const t = useAppT('groups');
	const tc = useT('common');
	const { data: enrollments = [], isLoading, isError } = useGroupEnrollments(groupId);
	const [enrollOpen, setEnrollOpen] = useState(false);
	const [pastOpen, setPastOpen] = useState(false);
	const [dropTarget, setDropTarget] = useState<Enrollment | null>(null);
	const [suspendTarget, setSuspendTarget] = useState<Enrollment | null>(null);
	const [reactivateTarget, setReactivateTarget] = useState<Enrollment | null>(null);

	const current = enrollments.filter((e) => occupiesSeat(e.status));
	const past = enrollments.filter((e) => !occupiesSeat(e.status));
	const enrolledIds = current.map((e) => e.studentId);

	const enrollButton = (
		<Can permission="enrollment.create">
			<Button size="sm" onClick={() => setEnrollOpen(true)}>
				<Plus className="mr-1.5 size-4" />
				{t('roster.enroll')}
			</Button>
		</Can>
	);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-sm text-muted-foreground">
					{capacity != null
						? t('roster.seatsOf', { filled: current.length, capacity })
						: t('roster.headcount', { count: current.length })}
				</span>
				{enrollButton}
			</div>

			{isLoading ? (
				<Card className="gap-0 divide-y divide-border py-0">
					{[1, 2, 3].map((i) => (
						<div key={i} className="px-4 py-3.5">
							<Skeleton className="h-9 w-full" />
						</div>
					))}
				</Card>
			) : isError ? (
				<Card className="py-0">
					<EmptyState
						icon={<Users />}
						title={tc('table.error')}
						description={tc('table.errorHint')}
					/>
				</Card>
			) : enrollments.length === 0 ? (
				<Card className="py-0">
					<EmptyState
						icon={<Users />}
						title={t('roster.emptyTitle')}
						description={t('roster.enrollDescription')}
						action={enrollButton}
					/>
				</Card>
			) : (
				<>
					{current.length > 0 && (
						<Card className="gap-0 divide-y divide-border py-0">
							{current.map((e) => (
								<EnrollmentRow
									key={e.id}
									enrollment={e}
									onDrop={setDropTarget}
									onSuspend={setSuspendTarget}
									onReactivate={setReactivateTarget}
								/>
							))}
						</Card>
					)}

					{past.length > 0 && (
						<Card className="gap-0 py-0">
							<button
								type="button"
								onClick={() => setPastOpen((o) => !o)}
								aria-expanded={pastOpen}
								className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
							>
								{pastOpen ? (
									<ChevronDown className="size-4 shrink-0" />
								) : (
									<ChevronRight className="size-4 shrink-0" />
								)}
								<span className="font-medium">
									{t('roster.past', { count: past.length })}
								</span>
								<span className="hidden truncate text-xs sm:block">
									· {t('roster.pastHint')}
								</span>
							</button>
							{pastOpen && (
								<>
									<Separator />
									<div className="divide-y divide-border">
										{past.map((e) => (
											<EnrollmentRow
												key={e.id}
												enrollment={e}
												onDrop={setDropTarget}
												onSuspend={setSuspendTarget}
												onReactivate={setReactivateTarget}
											/>
										))}
									</div>
								</>
							)}
						</Card>
					)}
				</>
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

// ─── Row ──────────────────────────────────────────────────────────────────────

/**
 * One student. The whole row opens their profile — the roster used to be a dead
 * end, with no way through to the student an admin had just spotted on it.
 *
 * `role="button"` rather than a real `<button>`: the row contains the actions
 * menu trigger, and a button inside a button is invalid markup.
 */
function EnrollmentRow({
	enrollment,
	onDrop,
	onSuspend,
	onReactivate,
}: {
	enrollment: Enrollment;
	onDrop: (e: Enrollment) => void;
	onSuspend: (e: Enrollment) => void;
	onReactivate: (e: Enrollment) => void;
}) {
	const t = useAppT('groups');
	const statusLabel = useStatusLabel();
	const navigate = useNavigate();

	const transitions = ENROLLMENT_TRANSITIONS[enrollment.status];
	const canReactivate = transitions.includes('ACTIVE');
	const canSuspend = transitions.includes('SUSPENDED');
	const canDrop = transitions.includes('DROPPED');
	const hasActions = canReactivate || canSuspend || canDrop;

	const open = () =>
		void navigate({
			to: '/students/$id',
			params: { id: String(enrollment.studentId) },
		});

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		open();
	};

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={open}
			onKeyDown={onKeyDown}
			aria-label={t('roster.openStudentAria', { name: enrollment.studentName })}
			className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
		>
			<div className="flex min-w-0 flex-col">
				<span className="truncate text-sm font-medium">
					{enrollment.studentName}
				</span>
				<span className="font-mono text-xs text-muted-foreground">
					{enrollment.studentCode}
				</span>
			</div>
			<div className="flex shrink-0 items-center gap-3">
				<span className="hidden text-xs text-muted-foreground sm:block">
					{t('roster.enrolledOn', { date: formatDate(enrollment.enrolledAt) })}
				</span>
				<StatusBadge kind="enrollment" status={enrollment.status}>
					{statusLabel('enrollment', enrollment.status)}
				</StatusBadge>
				{hasActions && (
					<Can permission="enrollment.update">
						{/* Stops a menu click from also opening the student. */}
						<div onClick={(event) => event.stopPropagation()}>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="size-8 p-0"
										aria-label={t('roster.rowActionsAria')}
									>
										<MoreHorizontal className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{canReactivate && (
										<DropdownMenuItem
											onClick={() => onReactivate(enrollment)}
										>
											<RotateCcw />
											{t('actions.reactivate')}
										</DropdownMenuItem>
									)}
									{canSuspend && (
										<DropdownMenuItem
											onClick={() => onSuspend(enrollment)}
										>
											<Pause />
											{t('actions.suspend')}
										</DropdownMenuItem>
									)}
									{canDrop && (
										<DropdownMenuItem
											variant="destructive"
											onClick={() => onDrop(enrollment)}
										>
											<UserMinus />
											{t('actions.drop')}
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</Can>
				)}
				<ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
			</div>
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
			cancelLabel={tc('action.cancel')}
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
			cancelLabel={tc('action.cancel')}
			loading={updateEnrollment.isPending}
			onConfirm={() => void onReactivate()}
		/>
	);
}
