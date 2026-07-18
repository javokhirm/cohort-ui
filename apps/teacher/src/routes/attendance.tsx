import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Ban, ClipboardCheck, LayoutGrid, List } from 'lucide-react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

import {
	Button,
	EmptyState,
	PageHeader,
	Skeleton,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
} from '@repo/ui';
import { formatFullDate } from '@repo/utils';

import { useIsMobile } from '@/hooks/use-is-mobile';
import {
	type AttendanceStatus,
	useSessionAttendance,
	useSessionDetail,
} from '@/features/attendance/api/attendance.queries';
import {
	type AttendanceInput,
	useSaveAttendance,
	useSetSessionTopic,
} from '@/features/attendance/api/attendance.mutations';
import { AttendanceList } from '@/features/attendance/components/AttendanceList';

/**
 * Take attendance for a session (`GET`/`POST`/`PATCH /teach/sessions/:id/attendances`,
 * api-reference §4.3), reached from a Today card. The editable draft is *derived*
 * each render — the teacher's overrides layered over the saved marks, with
 * unmarked students defaulting to PRESENT — so there is no state to sync in an
 * effect. Saving splits create-only (`POST`) from update-only (`PATCH`) by
 * whether each student already had a row.
 *
 * On desktop, this single-session list is the odd one out next to the group's
 * monthly table, so a fresh visit (no `?view=list`) auto-redirects there — the
 * same page the "Table" toggle jumps to. `?view=list` marks an explicit manual
 * pick, mirroring `?view=table` on `group-attendance.tsx`.
 */
export function AttendanceRoute() {
	const navigate = useNavigate();
	const { sessionId: sessionIdParam } = useParams({
		from: '/_authed/sessions/$sessionId/attendance',
	});
	const { view } = useSearch({ from: '/_authed/sessions/$sessionId/attendance' });
	const sessionId = Number(sessionIdParam);
	const isMobile = useIsMobile();

	const detailQuery = useSessionDetail(sessionId);
	const recordsQuery = useSessionAttendance(sessionId);
	const saveAttendance = useSaveAttendance(sessionId);
	const setSessionTopic = useSetSessionTopic(sessionId);

	// Only the teacher's edits live in state; everything else is derived.
	const [overrides, setOverrides] = useState<Map<number, AttendanceStatus>>(
		() => new Map(),
	);
	const [topicOverride, setTopicOverride] = useState<string | null>(null);

	const detail = detailQuery.data;
	const records = recordsQuery.data;
	const groupId = detail?.groupId;

	useEffect(() => {
		if (view === 'list' || isMobile || !groupId) return;
		void navigate({
			to: '/groups/$groupId/attendance',
			params: { groupId: String(groupId) },
			search: { month: undefined, view: 'table' },
			replace: true,
		});
	}, [view, isMobile, groupId, navigate]);

	const savedStatus = useMemo(
		() => new Map((records ?? []).map((r) => [r.studentId, r.status] as const)),
		[records],
	);

	// Derived draft: override ?? saved mark ?? PRESENT, for every rostered student.
	const draft = useMemo(() => {
		const next = new Map<number, AttendanceStatus>();
		for (const student of detail?.roster ?? []) {
			next.set(
				student.studentId,
				overrides.get(student.studentId) ??
					savedStatus.get(student.studentId) ??
					'PRESENT',
			);
		}
		return next;
	}, [detail, savedStatus, overrides]);

	const serverTopic = detail?.topic ?? '';
	const topic = topicOverride ?? serverTopic;

	// Dirty when there are edits, a topic change, or students not yet submitted.
	const hasUnsaved = (detail?.roster ?? []).some((s) => !savedStatus.has(s.studentId));
	const isDirty =
		overrides.size > 0 ||
		(topicOverride !== null && topicOverride !== serverTopic) ||
		hasUnsaved;

	const setStatus = (studentId: number, status: AttendanceStatus) => {
		setOverrides((prev) => new Map(prev).set(studentId, status));
	};

	/**
	 * The whole-class shortcut. It only ever runs when the draft isn't already
	 * all-present (the button is disabled then), so it can't dirty a clean form.
	 */
	const onAllPresent = () => {
		if (!detail) return;
		setOverrides(
			new Map(detail.roster.map((s) => [s.studentId, 'PRESENT'] as const)),
		);
	};

	const onSave = () => {
		if (!detail) return;
		const create: AttendanceInput[] = [];
		const update: AttendanceInput[] = [];
		for (const student of detail.roster) {
			const status = draft.get(student.studentId);
			if (!status) continue;
			const row: AttendanceInput = { studentId: student.studentId, status };
			(savedStatus.has(student.studentId) ? update : create).push(row);
		}
		const topicChanged = topic !== serverTopic;
		void Promise.all([
			create.length > 0 || update.length > 0
				? saveAttendance.mutateAsync({ create, update })
				: Promise.resolve(),
			topicChanged ? setSessionTopic.mutateAsync(topic) : Promise.resolve(),
		])
			.then(() => {
				setOverrides(new Map());
				setTopicOverride(null);
				toast.success('Attendance saved');
			})
			// Failures are surfaced by the global mutation error handler.
			.catch(() => undefined);
	};

	const isLoading = detailQuery.isPending || recordsQuery.isPending;
	const isError = detailQuery.isError || recordsQuery.isError;

	const viewToggle = detail ? (
		<Tabs
			value="list"
			onValueChange={(v) => {
				if (v === 'table') {
					void navigate({
						to: '/groups/$groupId/attendance',
						params: { groupId: String(detail.groupId) },
						search: { month: undefined, view: 'table' },
					});
				}
			}}
		>
			<TabsList>
				<TabsTrigger value="table" aria-label="Table view">
					<LayoutGrid />
				</TabsTrigger>
				<TabsTrigger value="list" aria-label="List view">
					<List />
				</TabsTrigger>
			</TabsList>
		</Tabs>
	) : null;

	const header = (
		<PageHeader
			className="shrink-0"
			title={detail?.courseName ?? 'Take attendance'}
			description={
				detail
					? `${detail.groupName} · ${formatFullDate(detail.sessionDate)}`
					: `Session #${sessionId}`
			}
			actions={viewToggle}
		/>
	);

	let body: ReactNode;
	if (isError) {
		body = (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<ClipboardCheck />}
					title="Couldn't load this session"
					description="Something went wrong. Try again in a moment."
					action={
						<Button
							variant="outline"
							onClick={() => {
								void detailQuery.refetch();
								void recordsQuery.refetch();
							}}
						>
							Try again
						</Button>
					}
				/>
			</div>
		);
	} else if (isLoading || !detail) {
		body = (
			<div className="space-y-3">
				<Skeleton className="h-20 w-full rounded-2xl" />
				<Skeleton className="h-24 w-full rounded-2xl" />
				<Skeleton className="h-24 w-full rounded-2xl" />
			</div>
		);
	} else if (detail.status === 'CANCELLED') {
		body = (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<Ban />}
					title="This session is cancelled"
					description="Attendance can't be taken for a cancelled session."
				/>
			</div>
		);
	} else if (detail.roster.length === 0) {
		body = (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<ClipboardCheck />}
					title="No students enrolled"
					description="This group has no active students to mark yet."
				/>
			</div>
		);
	} else {
		body = (
			<AttendanceList
				detail={detail}
				draft={draft}
				topic={topic}
				isSaving={saveAttendance.isPending || setSessionTopic.isPending}
				isDirty={isDirty}
				onChangeStatus={setStatus}
				onTopicChange={setTopicOverride}
				onMarkAllPresent={onAllPresent}
				onSave={onSave}
			/>
		);
	}

	return (
		<div className="mx-auto flex h-full w-full max-w-3xl flex-col">
			{header}
			<div className="flex min-h-0 flex-1 flex-col">{body}</div>
		</div>
	);
}
