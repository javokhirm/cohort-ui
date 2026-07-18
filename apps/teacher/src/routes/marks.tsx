import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Ban, LayoutGrid, List, Star } from 'lucide-react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

import {
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
import { useSessionDetail, useSessionMarks } from '@/features/marks/api/marks.queries';
import { type MarkInput, useSaveMarks } from '@/features/marks/api/marks.mutations';
import { MarksList } from '@/features/marks/components/MarksList';
import { markDisplay, parseScoreInput } from '@/features/marks/lib/scale';

/**
 * Enter a session's daily marks (`GET`/`POST`/`PATCH /teach/sessions/:id/marks`,
 * EduCore TEACH marks §1.1), reached from a Today card. Mirrors the attendance
 * list: the editable draft is derived each render (the teacher's edits layered
 * over the saved marks), so there's no state to sync. Saving splits create-only
 * (`POST`) from update-only (`PATCH`) by whether each student already had a mark.
 * The per-student editor's shape follows the group's active grading scale,
 * changed from the group's Grading tab, not from here. On desktop a fresh visit
 * redirects to the group's monthly table (the single-session list is the phone
 * view).
 */
export function MarksRoute() {
	const navigate = useNavigate();
	const { sessionId: sessionIdParam } = useParams({
		from: '/_authed/sessions/$sessionId/marks',
	});
	const { view } = useSearch({ from: '/_authed/sessions/$sessionId/marks' });
	const sessionId = Number(sessionIdParam);
	const isMobile = useIsMobile();

	const detailQuery = useSessionDetail(sessionId);
	const marksQuery = useSessionMarks(sessionId);
	const saveMarks = useSaveMarks(sessionId);

	const [overrides, setOverrides] = useState<Map<number, string>>(() => new Map());

	const detail = detailQuery.data;
	const config = marksQuery.data?.config;
	const groupId = detail?.groupId;

	useEffect(() => {
		if (view === 'list' || isMobile || !groupId) return;
		void navigate({
			to: '/groups/$groupId/marks',
			params: { groupId: String(groupId) },
			search: { month: undefined, view: 'table' },
			replace: true,
		});
	}, [view, isMobile, groupId, navigate]);

	// Saved mark per student, and its display string (score or letter).
	const savedByStudent = useMemo(
		() =>
			new Map((marksQuery.data?.marks ?? []).map((m) => [m.studentId, m] as const)),
		[marksQuery.data],
	);
	const savedDisplay = (studentId: number) => {
		const mark = savedByStudent.get(studentId);
		return mark ? markDisplay(mark) : '';
	};

	// Derived draft: override ?? saved display, for every rostered student.
	const draft = useMemo(() => {
		const next = new Map<number, string>();
		for (const student of detail?.roster ?? []) {
			next.set(
				student.studentId,
				overrides.get(student.studentId) ?? savedDisplay(student.studentId),
			);
		}
		return next;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [detail, savedByStudent, overrides]);

	const markedCount = [...draft.values()].filter((v) => v.trim() !== '').length;
	const isDirty = [...overrides.entries()].some(
		([studentId, value]) => value !== savedDisplay(studentId),
	);

	const setValue = (studentId: number, value: string) => {
		setOverrides((prev) => new Map(prev).set(studentId, value));
	};

	const onSave = () => {
		if (!detail || !config) return;
		const create: MarkInput[] = [];
		const update: MarkInput[] = [];
		for (const student of detail.roster) {
			const value = (draft.get(student.studentId) ?? '').trim();
			if (value === '') continue; // nothing to record; marks aren't cleared here
			const wasMarked = savedByStudent.has(student.studentId);
			if (wasMarked && value === savedDisplay(student.studentId)) continue; // unchanged

			const row: MarkInput =
				config.type === 'LETTER'
					? { studentId: student.studentId, letter: value }
					: { studentId: student.studentId, rawScore: parseScoreInput(value) };
			if (config.type !== 'LETTER' && row.rawScore === null) continue; // invalid number
			(wasMarked ? update : create).push(row);
		}
		if (create.length === 0 && update.length === 0) return;
		saveMarks.mutate(
			{ create, update },
			{
				onSuccess: () => {
					setOverrides(new Map());
					toast.success('Marks saved');
				},
			},
		);
	};

	const isLoading = detailQuery.isPending || marksQuery.isPending;
	const isError = detailQuery.isError || marksQuery.isError;

	const header = (
		<PageHeader
			title={detail?.courseName ?? 'Enter marks'}
			description={
				detail ? formatFullDate(detail.sessionDate) : `Session #${sessionId}`
			}
		/>
	);

	const viewToggle = detail ? (
		<div className="mt-4 flex justify-end">
			<Tabs
				value="list"
				onValueChange={(v) => {
					if (v === 'table') {
						void navigate({
							to: '/groups/$groupId/marks',
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
		</div>
	) : null;

	let body: ReactNode;
	if (isError) {
		body = (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<Star />}
					title="Couldn't load this session"
					description="Something went wrong. Try again in a moment."
				/>
			</div>
		);
	} else if (isLoading || !detail || !config) {
		body = (
			<div className="space-y-3">
				<Skeleton className="h-16 w-full rounded-2xl" />
				<Skeleton className="h-16 w-full rounded-2xl" />
				<Skeleton className="h-16 w-full rounded-2xl" />
			</div>
		);
	} else if (detail.status === 'CANCELLED') {
		body = (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<Ban />}
					title="This session is cancelled"
					description="Marks can't be entered for a cancelled session."
				/>
			</div>
		);
	} else if (detail.roster.length === 0) {
		body = (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<Star />}
					title="No students enrolled"
					description="This group has no active students to mark yet."
				/>
			</div>
		);
	} else {
		body = (
			<MarksList
				roster={detail.roster}
				config={config}
				draft={draft}
				markedCount={markedCount}
				isSaving={saveMarks.isPending}
				isDirty={isDirty}
				onChange={setValue}
				onSave={onSave}
			/>
		);
	}

	return (
		<div className="mx-auto flex h-full w-full max-w-3xl flex-col">
			<div className="flex shrink-0 items-center justify-between">
				{header}
				{viewToggle}
			</div>
			<div className="flex min-h-0 flex-1 flex-col">{body}</div>
		</div>
	);
}
