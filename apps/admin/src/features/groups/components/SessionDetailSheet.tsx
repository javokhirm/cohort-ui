import { useState, type ReactNode } from 'react';
import { AlertTriangle, CalendarClock, UserCog, X } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	DatePicker,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Skeleton,
	StatusBadge,
	Spinner,
	Textarea,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatDate } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { Can } from '@/components/Can';
import { useBranches } from '@/api/branches';
import { useStaffList } from '@/features/hr/api/staff.queries';
import { useRoomList } from '@/features/rooms/api/rooms.queries';

import { useSession } from '../api/sessions.queries';
import { useUpdateSession } from '../api/sessions.mutations';
import type { SessionDetail } from '../api/groups.queries';
import { formatSessionDuration, hhmm } from '../lib/group-options';

type Mode = 'view' | 'reschedule' | 'substitute' | 'cancel';

const NONE = 'none';

interface SessionDetailSheetProps {
	sessionId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Group id for cache invalidation when the sheet is opened from a group page. */
	groupId?: number;
}

export function SessionDetailSheet({
	sessionId,
	open,
	onOpenChange,
	groupId,
}: SessionDetailSheetProps) {
	const t = useAppT('groups');
	const { data: session, isLoading } = useSession(open ? sessionId : null);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
				<SheetHeader className="flex-row items-center justify-between border-b px-6 py-4">
					<SheetTitle>{t('sessions.detailTitle')}</SheetTitle>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto p-6">
					{isLoading || !session ? (
						<div className="flex flex-col gap-3">
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-40 w-full" />
						</div>
					) : (
						// Keyed by session id so switching sessions remounts with a
						// fresh view/conflict state — no reset effect needed.
						<SessionBody
							key={session.id}
							session={session}
							groupId={groupId}
							onDone={() => onOpenChange(false)}
						/>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}

// ─── Body ────────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined): string {
	if (!name) return '?';
	return name
		.split(' ')
		.map((w) => w[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div>
			<div className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
				{label}
			</div>
			<div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
		</div>
	);
}

function SessionBody({
	session,
	groupId,
	onDone,
}: {
	session: SessionDetail;
	groupId?: number;
	onDone: () => void;
}) {
	const t = useAppT('groups');
	const statusLabel = useStatusLabel();
	const [mode, setMode] = useState<Mode>('view');
	const [conflict, setConflict] = useState<string | null>(null);
	const cancelled = session.status === 'CANCELLED';
	const completed = session.status === 'COMPLETED';

	const { data: branches = [] } = useBranches();
	const branchName = branches.find((b) => b.id === session.branchId)?.name ?? '—';

	return (
		<div className="flex flex-col gap-4">
			{conflict && (
				<div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
					<div>
						<p className="font-semibold text-destructive">
							{t('sessions.conflict')}
						</p>
						<p className="text-destructive/90">{conflict}</p>
					</div>
				</div>
			)}

			{/* Title + status */}
			<div className="rounded-xl border bg-card p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="truncate text-base font-bold">
							{session.groupName}
						</div>
						<div className="mt-0.5 text-sm text-muted-foreground">
							{session.courseName}
						</div>
					</div>
					<StatusBadge
						kind="session"
						status={session.status}
						className="shrink-0"
					>
						{statusLabel('session', session.status)}
					</StatusBadge>
				</div>
				<div className="mt-3 flex items-center gap-2 border-t pt-3">
					<CalendarClock className="size-4 text-primary" />
					<span className="text-sm font-semibold">
						{formatDate(session.sessionDate)}
					</span>
				</div>
			</div>

			{cancelled && session.cancellationReason && (
				<div className="rounded-lg bg-muted px-3 py-2 text-sm">
					<span className="font-medium">
						{t('sessions.cancellationReasonLabel')}:{' '}
					</span>
					{session.cancellationReason}
				</div>
			)}

			{/* Details */}
			<div className="rounded-xl border bg-card p-4">
				<div className="mb-3 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
					{t('form.section.details')}
				</div>
				<div className="grid grid-cols-2 gap-x-4 gap-y-3">
					<DetailField
						label={t('sessions.column.time')}
						value={`${hhmm(session.startTime)} – ${hhmm(session.endTime)}`}
					/>
					<DetailField
						label={t('detail.stat.duration')}
						value={formatSessionDuration(
							t,
							session.startTime,
							session.endTime,
						)}
					/>
					<DetailField
						label={t('sessions.column.room')}
						value={session.roomName ?? t('notSet')}
					/>
					<DetailField label={t('sessions.branch')} value={branchName} />
					<div className="col-span-2">
						<div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
							{t('sessions.column.teacher')}
						</div>
						<div className="flex items-center gap-2">
							<Avatar className="size-7">
								<AvatarFallback className="text-[11px]">
									{initials(session.teacherName)}
								</AvatarFallback>
							</Avatar>
							<span className="text-sm font-semibold">
								{session.teacherName ?? t('unassigned')}
							</span>
						</div>
					</div>
					<div className="col-span-2">
						<DetailField
							label={t('sessions.column.topic')}
							value={session.topic ?? t('notSet')}
						/>
					</div>
				</div>
			</div>

			{/* Actions — reschedule / substitute / cancel all PATCH the session */}
			{!cancelled && !completed && (
				<Can permission="session.update">
					<SessionActions
						session={session}
						mode={mode}
						setMode={setMode}
						setConflict={setConflict}
						groupId={groupId}
						onDone={onDone}
					/>
				</Can>
			)}
		</div>
	);
}

// ─── Actions (reschedule / substitute / cancel) ──────────────────────────────

function SessionActions({
	session,
	mode,
	setMode,
	setConflict,
	groupId,
	onDone,
}: {
	session: SessionDetail;
	mode: Mode;
	setMode: (m: Mode) => void;
	setConflict: (c: string | null) => void;
	groupId?: number;
	onDone: () => void;
}) {
	const t = useAppT('groups');
	const tc = useT('common');
	const updateSession = useUpdateSession();

	const { data: teacherData } = useStaffList({ role: 'TEACHER', limit: 100 });
	const { data: roomData } = useRoomList({
		limit: 100,
		branchIds: [session.branchId],
		isActive: true,
	});
	const teachers = teacherData?.rows ?? [];
	const rooms = roomData?.rows ?? [];

	// Local form state per mode.
	const [date, setDate] = useState(session.sessionDate);
	const [startTime, setStartTime] = useState(hhmm(session.startTime));
	const [endTime, setEndTime] = useState(hhmm(session.endTime));
	const [roomId, setRoomId] = useState(
		session.roomId != null ? String(session.roomId) : NONE,
	);
	const [teacherId, setTeacherId] = useState(
		session.teacherId != null ? String(session.teacherId) : NONE,
	);
	const [reason, setReason] = useState('');

	async function run(
		payload: Parameters<typeof updateSession.mutateAsync>[0],
		successMsg: string,
	) {
		setConflict(null);
		try {
			await updateSession.mutateAsync({ ...payload, id: session.id, groupId });
			toast.success(successMsg);
			setMode('view');
		} catch (err) {
			if (isApiError(err) && err.status === 409) {
				setConflict(err.message);
			} else if (isApiError(err)) {
				toast.error(err.message);
			} else {
				toast.error(tc('error.unknown'));
			}
		}
	}

	const pending = updateSession.isPending;

	if (mode === 'view') {
		return (
			<div className="flex flex-col gap-2 border-t pt-4">
				<div className="grid grid-cols-2 gap-2">
					<Button variant="outline" onClick={() => setMode('reschedule')}>
						<CalendarClock className="mr-2 size-4" />
						{t('actions.reschedule')}
					</Button>
					<Button variant="outline" onClick={() => setMode('substitute')}>
						<UserCog className="mr-2 size-4" />
						{t('actions.substitute')}
					</Button>
				</div>
				<Button
					variant="outline"
					className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
					onClick={() => setMode('cancel')}
				>
					<X className="mr-2 size-4" />
					{t('sessions.cancel.action')}
				</Button>
			</div>
		);
	}

	if (mode === 'reschedule') {
		return (
			<div className="flex flex-col gap-3 border-t pt-4">
				<h3 className="text-sm font-semibold">
					{t('sessions.reschedule.action')}
				</h3>
				<div>
					<Label className="mb-1.5">{t('sessions.column.date')}</Label>
					<DatePicker
						value={date}
						onChange={(value) => setDate(value ?? '')}
						className="w-full"
					/>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<Label className="mb-1.5">{t('sessions.column.start')}</Label>
						<input
							type="time"
							value={startTime}
							onChange={(e) => setStartTime(e.target.value)}
							className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
						/>
					</div>
					<div>
						<Label className="mb-1.5">{t('sessions.end')}</Label>
						<input
							type="time"
							value={endTime}
							onChange={(e) => setEndTime(e.target.value)}
							className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
						/>
					</div>
				</div>
				<div>
					<Label className="mb-1.5">{t('sessions.column.room')}</Label>
					<Select value={roomId} onValueChange={setRoomId}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={NONE}>{t('noRoom')}</SelectItem>
							{rooms.map((r) => (
								<SelectItem key={r.id} value={String(r.id)}>
									{r.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<ActionButtons
					onCancel={() => setMode('view')}
					pending={pending}
					confirmLabel={t('form.saveChanges')}
					onConfirm={() =>
						void run(
							{
								id: session.id,
								sessionDate: date,
								startTime,
								endTime,
								roomId: roomId === NONE ? null : Number(roomId),
							},
							t('sessions.reschedule.done'),
						)
					}
				/>
			</div>
		);
	}

	if (mode === 'substitute') {
		return (
			<div className="flex flex-col gap-3 border-t pt-4">
				<h3 className="text-sm font-semibold">
					{t('sessions.substitute.action')}
				</h3>
				<div>
					<Label className="mb-1.5">{t('sessions.column.teacher')}</Label>
					<Select value={teacherId} onValueChange={setTeacherId}>
						<SelectTrigger className="w-full">
							<SelectValue
								placeholder={t('form.field.teacherPlaceholder')}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={NONE}>{t('unassigned')}</SelectItem>
							{teachers.map((t) => (
								<SelectItem key={t.id} value={String(t.id)}>
									{t.user.firstName} {t.user.lastName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<ActionButtons
					onCancel={() => setMode('view')}
					pending={pending}
					confirmLabel={t('sessions.substitute.confirm')}
					onConfirm={() =>
						void run(
							{
								id: session.id,
								teacherId: teacherId === NONE ? null : Number(teacherId),
							},
							t('sessions.substitute.done'),
						)
					}
				/>
			</div>
		);
	}

	// cancel
	return (
		<div className="flex flex-col gap-3 border-t pt-4">
			<h3 className="text-sm font-semibold text-destructive">
				{t('sessions.cancel.action')}
			</h3>
			<p className="text-sm text-muted-foreground">
				{t('sessions.cancel.warning')}
			</p>
			<div>
				<Label className="mb-1.5">{t('sessions.cancel.reasonRequired')}</Label>
				<Textarea
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					placeholder={t('sessions.cancel.reasonPlaceholder')}
					rows={3}
				/>
			</div>
			<ActionButtons
				onCancel={() => setMode('view')}
				pending={pending}
				confirmLabel={t('sessions.cancel.confirm')}
				destructive
				disabled={reason.trim().length === 0}
				onConfirm={() =>
					void run(
						{
							id: session.id,
							status: 'CANCELLED',
							cancellationReason: reason.trim(),
						},
						t('sessions.cancel.done'),
					).then(() => onDone())
				}
			/>
		</div>
	);
}

function ActionButtons({
	onCancel,
	onConfirm,
	pending,
	confirmLabel,
	destructive,
	disabled,
}: {
	onCancel: () => void;
	onConfirm: () => void;
	pending: boolean;
	confirmLabel: string;
	destructive?: boolean;
	disabled?: boolean;
}) {
	const tc = useT('common');
	return (
		<div className="flex gap-2">
			<Button
				type="button"
				variant="outline"
				className="flex-1"
				onClick={onCancel}
				disabled={pending}
			>
				{tc('action.back')}
			</Button>
			<Button
				type="button"
				variant={destructive ? 'destructive' : 'default'}
				className="flex-1"
				onClick={onConfirm}
				disabled={pending || disabled}
			>
				{pending && <Spinner className="mr-2 size-4" />}
				{confirmLabel}
			</Button>
		</div>
	);
}
