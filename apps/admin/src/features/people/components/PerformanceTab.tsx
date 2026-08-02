import { useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';

import {
	Card,
	CardContent,
	DataTable,
	EmptyState,
	Pagination,
	ProgressBar,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	StatusBadge,
	type ColumnDef,
} from '@repo/ui';
import { addDays, formatDate, todayIsoDate } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';

import { useAppT } from '@/locales';
import type { StudentPerformanceFilters } from '../api/keys';
import {
	STUDENT_TAB_PAGE_SIZE,
	useStudentEnrollments,
	useStudentPerformance,
	useStudentPerformanceSessions,
	type AttendanceStatus,
	type PerformanceSession,
} from '../api/students.queries';
import {
	MARK_TONE_FG,
	averageMarkLabel,
	markTone,
	markValueLabel,
	scaleNameLabel,
} from '../lib/mark-format';

type PeopleT = ReturnType<typeof useAppT<'people'>>;

const ALL = 'all';

/**
 * The period presets, resolved to an explicit `from`/`to` window client-side.
 * The API takes no named preset: "this month" is relative to the education
 * center's clock, and `@repo/utils`' date helpers are already Tashkent-based,
 * whereas the request carries no timezone at all.
 */
type PeriodValue = 'all' | 'thisMonth' | 'last30' | 'last90';

const PERIOD_OPTIONS: PeriodValue[] = ['all', 'thisMonth', 'last30', 'last90'];

function periodWindow(period: PeriodValue): { from?: string; to?: string } {
	if (period === 'all') return {};
	const today = todayIsoDate();
	// Both bounds are inclusive server-side, so `to: today` keeps a class held
	// today in the window while excluding anything marked ahead of time.
	if (period === 'thisMonth') return { from: `${today.slice(0, 7)}-01`, to: today };
	return { from: addDays(today, period === 'last30' ? -29 : -89), to: today };
}

const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];

/** The mark cell: the value in its own scale, with a bar keyed off the percentage. */
function MarkCell({ session, t }: { session: PerformanceSession; t: PeopleT }) {
	const { mark, status } = session;

	if (!mark) {
		// An absent/excused class was never expected to carry a mark; a class the
		// student attended is teacher backlog. Same `null`, different meaning.
		const attended = status === 'PRESENT' || status === 'LATE';
		return (
			<span className="text-xs text-muted-foreground">
				{attended ? t('detail.performance.notMarked') : '—'}
			</span>
		);
	}

	const tone = markTone(mark.normalizedPct);
	return (
		<div className="flex items-center justify-end gap-2.5">
			<ProgressBar
				value={mark.normalizedPct}
				tone={tone === 'indigo' ? 'indigo' : tone}
				className="w-13"
			/>
			<span className={`text-sm font-bold tabular-nums ${MARK_TONE_FG[tone]}`}>
				{markValueLabel(mark.scale, mark.rawScore, mark.letter)}
			</span>
		</div>
	);
}

/**
 * Columns are built per render rather than held at module scope: their headers
 * are user-facing, so they must re-resolve when the language changes.
 */
const buildSessionColumns = (
	t: PeopleT,
	statusLabel: ReturnType<typeof useStatusLabel>,
): ColumnDef<PerformanceSession>[] => [
	{
		accessorKey: 'sessionDate',
		header: t('detail.performance.column.date'),
		cell: ({ getValue }) => (
			<span className="text-muted-foreground tabular-nums">
				{formatDate(getValue<string>())}
			</span>
		),
	},
	{
		id: 'session',
		header: t('detail.performance.column.session'),
		cell: ({ row }) => (
			<div className="min-w-0">
				<p className="truncate font-medium">
					{row.original.topic ?? t('detail.performance.noTopic')}
				</p>
				<p className="text-xs text-muted-foreground">{row.original.groupName}</p>
			</div>
		),
	},
	{
		accessorKey: 'status',
		header: t('detail.performance.column.attendance'),
		cell: ({ getValue }) => (
			<StatusBadge kind="attendance" status={getValue<string>()}>
				{statusLabel('attendance', getValue<string>())}
			</StatusBadge>
		),
	},
	{
		id: 'mark',
		header: () => (
			<div className="text-right">{t('detail.performance.column.mark')}</div>
		),
		cell: ({ row }) => <MarkCell session={row.original} t={t} />,
	},
];

interface PerformanceTabProps {
	studentId: number;
}

/**
 * Student detail → Performance: attendance and **daily session marks** over one
 * period, for one or all of the student's groups.
 *
 * Two endpoints back it. The KPI cards read `/performance`, which aggregates the
 * whole window, so paging the history below never moves the headline figures.
 * The `status` select narrows only the list — a status-filtered attendance rate
 * would not be a rate (filter to "Absent" and every student reads 0%), so the
 * cards deliberately do not receive it.
 */
export function PerformanceTab({ studentId }: PerformanceTabProps) {
	const t = useAppT('people');
	const tc = useT('common');
	const statusLabel = useStatusLabel();

	const [period, setPeriod] = useState<PeriodValue>('all');
	const [groupId, setGroupId] = useState<number | undefined>(undefined);
	const [status, setStatus] = useState<AttendanceStatus | undefined>(undefined);
	const [page, setPage] = useState(1);

	// The student's own groups — the only values the group filter may take, which
	// is why an out-of-scope id is an empty result server-side rather than a 404.
	const { data: enrollments = [] } = useStudentEnrollments(studentId);
	const groupOptions = useMemo(() => {
		const seen = new Map<number, string>();
		for (const e of enrollments) seen.set(e.groupId, e.groupName);
		return [...seen].map(([id, name]) => ({ id, name }));
	}, [enrollments]);

	const periodRange = periodWindow(period);
	const summaryFilters: Omit<StudentPerformanceFilters, 'status'> = {
		...periodRange,
		groupId,
	};
	const listFilters: StudentPerformanceFilters = { ...summaryFilters, status };

	const { data: summary, isLoading: summaryLoading } = useStudentPerformance(
		studentId,
		summaryFilters,
	);
	const { data, isLoading } = useStudentPerformanceSessions(
		studentId,
		listFilters,
		page,
	);

	const sessions = data?.rows ?? [];
	const total = data?.total ?? 0;
	const hasFilters = period !== 'all' || groupId !== undefined || status !== undefined;

	/** Any filter change invalidates the current page number. */
	function resetPage<T>(set: (v: T) => void) {
		return (v: T) => {
			set(v);
			setPage(1);
		};
	}

	function clearFilters() {
		setPeriod('all');
		setGroupId(undefined);
		setStatus(undefined);
		setPage(1);
	}

	// Both queries gate the skeleton: settling the list first would flash the
	// empty state before the cards can say otherwise.
	if ((isLoading && !data) || (summaryLoading && !summary)) {
		return (
			<div className="flex flex-col gap-4">
				<div className="grid gap-4 sm:grid-cols-2">
					<Skeleton className="h-28 rounded-xl" />
					<Skeleton className="h-28 rounded-xl" />
				</div>
				<Skeleton className="h-64 rounded-xl" />
			</div>
		);
	}

	const attendance = summary?.attendance;
	const marks = summary?.marks;

	const averageLabel = marks
		? averageMarkLabel(marks.averageRaw, marks.averagePct, marks.scales)
		: null;
	// Only nameable when a single scale is in play; across two the average is a
	// percentage and naming one of them would misdescribe it.
	const singleScaleName =
		marks && marks.scales.length === 1
			? scaleNameLabel(marks.scales[0], (key, vars) =>
					t(`detail.performance.${key}`, vars),
				)
			: null;

	const span = summary?.span;
	const spanLabel =
		span?.firstSessionDate && span.lastSessionDate
			? `${formatDate(span.firstSessionDate)} – ${formatDate(span.lastSessionDate)}`
			: null;

	// Nothing has ever been marked for this student, filters aside — the cards
	// would otherwise render "—" over an empty table for no clear reason.
	if (!hasFilters && (attendance?.totalMarked ?? 0) === 0) {
		return (
			<div className="rounded-xl border bg-card">
				<EmptyState
					icon={<CalendarCheck />}
					title={t('detail.performance.emptyTitle')}
					description={t('detail.performance.emptyDescription')}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Filters */}
			<div className="flex flex-wrap items-center gap-2">
				<Select
					className="w-auto"
					value={period}
					onValueChange={resetPage((v: string) => setPeriod(v as PeriodValue))}
				>
					<SelectTrigger className="h-9 w-40" size="sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{PERIOD_OPTIONS.map((opt) => (
							<SelectItem key={opt} value={opt}>
								{t(`detail.performance.period.${opt}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					className="w-auto"
					value={groupId === undefined ? ALL : String(groupId)}
					onValueChange={resetPage((v: string) =>
						setGroupId(v === ALL ? undefined : Number(v)),
					)}
				>
					<SelectTrigger className="h-9 w-44" size="sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>
							{t('detail.performance.allGroups')}
						</SelectItem>
						{groupOptions.map((g) => (
							<SelectItem key={g.id} value={String(g.id)}>
								{g.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					className="w-auto"
					value={status ?? ALL}
					onValueChange={resetPage((v: string) =>
						setStatus(v === ALL ? undefined : (v as AttendanceStatus)),
					)}
				>
					<SelectTrigger className="h-9 w-36" size="sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>{tc('state.all')}</SelectItem>
						{STATUS_OPTIONS.map((s) => (
							<SelectItem key={s} value={s}>
								{statusLabel('attendance', s)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{hasFilters && (
					<button
						type="button"
						onClick={clearFilters}
						className="px-1 text-sm text-muted-foreground hover:text-primary"
					>
						{t('detail.performance.clearFilters')}
					</button>
				)}
			</div>

			{/* KPI cards */}
			<div className="grid items-start gap-4 sm:grid-cols-2">
				<Card>
					<CardContent className="flex items-start justify-between gap-3">
						<div>
							<p className="text-sm text-muted-foreground">
								{t('detail.performance.attendanceRate')}
							</p>
							<div className="mt-1 flex items-baseline gap-2">
								<span className="text-3xl font-bold tabular-nums tracking-tight">
									{attendance?.rate == null
										? '—'
										: `${attendance.rate}%`}
								</span>
							</div>
							<p className="mt-1.5 text-xs text-muted-foreground">
								{attendance
									? t('detail.performance.attendanceMeta', {
											attended:
												attendance.counts.present +
												attendance.counts.late,
											total: attendance.totalMarked,
										})
									: '—'}
							</p>
						</div>
						{attendance?.belowAlertThreshold && (
							<StatusBadge tone="red">
								{t('detail.performance.belowPolicy', {
									threshold: attendance.alertThresholdPct,
								})}
							</StatusBadge>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							{t('detail.performance.averageMark')}
						</p>
						<div className="mt-1 flex items-baseline gap-2">
							<span className="text-3xl font-bold tabular-nums tracking-tight">
								{averageLabel ?? '—'}
							</span>
							{singleScaleName && (
								<span className="text-xs text-muted-foreground">
									{singleScaleName}
								</span>
							)}
						</div>
						<p className="mt-1.5 text-xs text-muted-foreground">
							{marks
								? t('detail.performance.markMeta', {
										count: marks.markedCount,
									})
								: '—'}
							{marks && marks.unmarkedCount > 0
								? ` · ${t('detail.performance.unmarkedMeta', {
										count: marks.unmarkedCount,
									})}`
								: ''}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Session history */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between gap-3">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						{t('detail.performance.sessionHistory')}
					</p>
					{spanLabel && (
						<span className="text-xs text-muted-foreground">{spanLabel}</span>
					)}
				</div>

				<DataTable
					columns={buildSessionColumns(t, statusLabel)}
					data={sessions}
					getRowId={(row) => String(row.id)}
					emptyState={
						<div className="flex min-h-32 flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
							<span>{t('detail.performance.emptyFiltered')}</span>
							{hasFilters && (
								<button
									type="button"
									onClick={clearFilters}
									className="text-primary hover:underline"
								>
									{t('detail.performance.clearFilters')}
								</button>
							)}
						</div>
					}
				/>

				{total > STUDENT_TAB_PAGE_SIZE && (
					<Pagination
						page={page}
						pageSize={STUDENT_TAB_PAGE_SIZE}
						total={total}
						onPageChange={setPage}
					/>
				)}
			</div>
		</div>
	);
}
