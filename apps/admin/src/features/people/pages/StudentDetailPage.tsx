import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Edit, MessageSquare, Plus, Trash2, Users } from 'lucide-react';

import {
	ActionsMenu,
	Button,
	Card,
	CardContent,
	ConfirmDialog,
	DataTable,
	EmptyState,
	PageNav,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Skeleton,
	StatusBadge,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
	type ColumnDef,
} from '@repo/ui';
import { formatDate } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';

import { Can } from '@/components/Can';
import { useGoBack } from '@/hooks/useGoBack';
import { useAppT } from '@/locales';
import { usePermissions } from '@/features/auth/hooks';
import { StandingDiscountCell } from '@/features/billing';
import { useBranches } from '@/api/branches';
import {
	useStudent,
	useStudentGuardians,
	useStudentEnrollments,
} from '../api/students.queries';
import type { Guardian, Enrollment } from '../api/students.queries';
import { useRemoveGuardian } from '../api/students.mutations';
import { AddGuardianDialog } from '../components/AddGuardianDialog';
import { BillingTab } from '../components/BillingTab';
import { GradesTab } from '../components/GradesTab';
import { GuardianDetailSheet } from '../components/GuardianDetailSheet';
import { PerformanceTab } from '../components/PerformanceTab';
import { StudentForm } from '../components/StudentForm';
import { WalletSection } from '../components/WalletSection';

type PeopleT = ReturnType<typeof useAppT<'people'>>;

function genderLabel(t: PeopleT, g?: string | null): string {
	if (g === 'M' || g === 'F' || g === 'O') return t(`gender.${g}`);
	return '—';
}

// ─── Student header ───────────────────────────────────────────────────────────

function StudentHeader({ studentId, onEdit }: { studentId: number; onEdit: () => void }) {
	const t = useAppT('people');
	const statusLabel = useStatusLabel();
	const { data: student, isLoading } = useStudent(studentId);
	const { data: branches = [] } = useBranches();
	const { can } = usePermissions();

	if (isLoading || !student) {
		return (
			<div className="rounded-xl border bg-card p-5">
				<div className="flex items-center gap-4">
					<Skeleton className="size-12 rounded-full" />
					<div className="flex flex-col gap-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-64" />
					</div>
				</div>
			</div>
		);
	}

	const initials =
		`${student.user.firstName?.[0] ?? ''}${student.user.lastName?.[0] ?? ''}`.toUpperCase();
	const branchName = branches.find((b) => b.id === student.branchId)?.name ?? '—';

	return (
		<div className="rounded-xl border bg-card p-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
						{initials}
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-lg font-bold">
								{student.user.firstName} {student.user.lastName}
							</h1>
							<StatusBadge kind="student" status={student.status}>
								{statusLabel('student', student.status)}
							</StatusBadge>
						</div>
						<div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
							<span>{student.studentCode}</span>
							<span>·</span>
							<span>{branchName}</span>
							{student.user.phone && (
								<>
									<span>·</span>
									<span>{student.user.phone}</span>
								</>
							)}
						</div>
					</div>
				</div>

				<ActionsMenu
					label={t('detail.actionsLabel')}
					items={[
						{
							label: t('detail.action.edit'),
							icon: Edit,
							onClick: onEdit,
							hidden: !can('student.update'),
						},
						{ label: t('detail.action.message'), icon: MessageSquare },
						{
							label: t('detail.action.createInvoice'),
							icon: Plus,
							hidden: !can('invoice.create'),
						},
					]}
				/>
			</div>
		</div>
	);
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ studentId }: { studentId: number }) {
	const t = useAppT('people');
	const { data: student } = useStudent(studentId);
	if (!student) return null;

	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<Card className="lg:col-span-2">
				<CardContent>
					<p className="mb-4 font-semibold">{t('detail.overview.title')}</p>
					<div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
						<div>
							<p className="text-muted-foreground">
								{t('detail.overview.dateOfBirth')}
							</p>
							<p className="mt-0.5 font-medium">
								{student.dateOfBirth
									? formatDate(student.dateOfBirth)
									: '—'}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">
								{t('detail.overview.address')}
							</p>
							<p className="mt-0.5 font-medium">{student.address ?? '—'}</p>
						</div>
						<div>
							<p className="text-muted-foreground">
								{t('detail.overview.gender')}
							</p>
							<p className="mt-0.5 font-medium">
								{genderLabel(t, student.gender)}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">
								{t('detail.overview.enrolledAt')}
							</p>
							<p className="mt-0.5 font-medium">
								{formatDate(student.enrolledAt)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Guardians tab ────────────────────────────────────────────────────────────

function GuardiansTab({ studentId }: { studentId: number }) {
	const t = useAppT('people');
	const tc = useT('common');
	const { data: guardians = [], isLoading } = useStudentGuardians(studentId);
	const removeGuardian = useRemoveGuardian();
	const [addOpen, setAddOpen] = useState(false);
	const [viewGuardianId, setViewGuardianId] = useState<number | null>(null);
	const [removeTarget, setRemoveTarget] = useState<Guardian | null>(null);

	function handleRemoveConfirm() {
		if (!removeTarget) return;
		removeGuardian.mutate(
			{ studentId, guardianId: removeTarget.guardianUserId },
			{
				onSuccess: () => {
					toast.success(t('detail.guardians.removed'));
					setRemoveTarget(null);
				},
			},
		);
	}

	const addButton = (
		<Can permission="student.guardian.manage">
			<Button size="sm" onClick={() => setAddOpen(true)}>
				<Plus className="mr-1.5 size-4" />
				{t('detail.guardians.add')}
			</Button>
		</Can>
	);

	const dialog = (
		<AddGuardianDialog
			studentId={studentId}
			isFirstGuardian={guardians.length === 0}
			open={addOpen}
			onOpenChange={setAddOpen}
		/>
	);

	const detailSheet = (
		<GuardianDetailSheet
			guardianId={viewGuardianId}
			open={viewGuardianId != null}
			onOpenChange={(open) => {
				if (!open) setViewGuardianId(null);
			}}
		/>
	);

	const removeDialog = (
		<ConfirmDialog
			open={removeTarget != null}
			onOpenChange={(open) => {
				if (!open) setRemoveTarget(null);
			}}
			title={t('detail.guardians.removeConfirm', {
				name: removeTarget
					? `${removeTarget.user.firstName} ${removeTarget.user.lastName}`
					: '',
			})}
			confirmLabel={t('detail.guardians.remove')}
			cancelLabel={tc('action.cancel')}
			variant="destructive"
			loading={removeGuardian.isPending}
			onConfirm={handleRemoveConfirm}
		/>
	);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-3">
				{[1, 2].map((i) => (
					<Skeleton key={i} className="h-16 rounded-xl" />
				))}
			</div>
		);
	}

	if (guardians.length === 0) {
		return (
			<div className="flex flex-col gap-3">
				<Card className="py-0">
					<EmptyState
						icon={<Users />}
						title={t('detail.guardians.empty')}
						description={t('detail.guardians.emptyDescription')}
						action={addButton}
					/>
				</Card>
				{dialog}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex justify-end">{addButton}</div>
			<div className="rounded-xl border bg-card">
				{guardians.map((g, i) => {
					const initials =
						`${g.user.firstName[0] ?? ''}${g.user.lastName[0] ?? ''}`.toUpperCase();
					const relationLabel = t(
						`relation.${g.relation as 'father' | 'mother' | 'guardian'}`,
					);
					return (
						<div key={g.id}>
							{i > 0 && <Separator />}
							<div
								className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50"
								onClick={() => setViewGuardianId(g.guardianUserId)}
							>
								<div className="flex items-center gap-3">
									<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
										{initials}
									</div>
									<div>
										<div className="flex items-center gap-3">
											<span className="text-xs font-semibold text-muted-foreground">
												{relationLabel}
											</span>
											<span className="font-medium">
												{g.user.firstName} {g.user.lastName}
											</span>
											{g.isPrimary && (
												<StatusBadge tone="indigo">
													{t('detail.guardians.primary')}
												</StatusBadge>
											)}
											{g.canPickup && (
												<StatusBadge tone="green">
													{t('detail.guardians.pickup')}
												</StatusBadge>
											)}
										</div>
										<div className="mt-0.5 text-sm text-muted-foreground">
											{g.user.phone ?? '—'}
										</div>
									</div>
								</div>
								<Can permission="student.guardian.manage">
									<Button
										variant="ghost"
										size="sm"
										className="text-muted-foreground hover:text-destructive"
										onClick={(e) => {
											e.stopPropagation();
											setRemoveTarget(g);
										}}
									>
										<Trash2 className="size-4" />
									</Button>
								</Can>
							</div>
						</div>
					);
				})}
			</div>
			{dialog}
			{detailSheet}
			{removeDialog}
		</div>
	);
}

// ─── Enrollments tab ──────────────────────────────────────────────────────────

const ENROLLMENT_STATUS_ALL = 'all';

/** Values only — labels resolve at render (conventions.md §7). */
const ENROLLMENT_STATUS_FILTER_OPTIONS: { value: string }[] = [
	{ value: ENROLLMENT_STATUS_ALL },
	{ value: 'ACTIVE' },
	{ value: 'SUSPENDED' },
	{ value: 'DROPPED' },
	{ value: 'COMPLETED' },
	{ value: 'TRANSFERRED' },
];

/**
 * Column tables are built per render rather than held at module scope: their
 * headers are user-facing, so they must re-resolve when the language changes.
 */
const buildEnrollmentColumns = (
	t: PeopleT,
	statusLabel: ReturnType<typeof useStatusLabel>,
): ColumnDef<Enrollment>[] => [
	{
		accessorKey: 'groupName',
		header: t('detail.enrollments.column.group'),
		cell: ({ getValue }) => (
			<span className="text-muted-foreground text-xs">{getValue<string>()}</span>
		),
	},
	{
		accessorKey: 'courseName',
		header: t('detail.enrollments.column.course'),
		cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
	},
	{
		accessorKey: 'enrolledAt',
		header: t('detail.enrollments.column.from'),
		cell: ({ getValue }) => (
			<span className="text-muted-foreground">
				{formatDate(getValue<string>())}
			</span>
		),
	},
	{
		accessorKey: 'status',
		header: t('detail.enrollments.column.status'),
		cell: ({ getValue }) => (
			<StatusBadge kind="enrollment" status={getValue<string>()}>
				{statusLabel('enrollment', getValue<string>())}
			</StatusBadge>
		),
	},
];

/** Standing per-enrollment discount column — gated to `enrollment.discount.manage`. */
const buildStandingDiscountColumn = (t: PeopleT): ColumnDef<Enrollment> => ({
	id: 'standingDiscount',
	header: t('detail.enrollments.column.standingDiscount'),
	cell: ({ row }) => (
		<StandingDiscountCell
			enrollmentId={row.original.id}
			groupName={row.original.groupName}
		/>
	),
});

function EnrollmentsTab({ studentId }: { studentId: number }) {
	const t = useAppT('people');
	const tc = useT('common');
	const statusLabel = useStatusLabel();
	const { data: enrollments = [], isLoading } = useStudentEnrollments(studentId);
	const { can } = usePermissions();
	const [statusFilter, setStatusFilter] = useState<Enrollment['status'] | undefined>(
		undefined,
	);

	// The discount endpoints require `enrollment.discount.manage` (OWNER/ADMIN, not
	// MANAGER), so drop the whole column for users without it — showing it would
	// only 403 on fetch.
	const baseColumns = buildEnrollmentColumns(t, statusLabel);
	const columns = can('enrollment.discount.manage')
		? [...baseColumns, buildStandingDiscountColumn(t)]
		: baseColumns;

	if (isLoading) {
		return <Skeleton className="h-32 rounded-xl" />;
	}

	// Not paginated (a student has few enrollments), so filter client-side rather
	// than round-tripping — the endpoint doesn't take a `status` query param.
	const visibleEnrollments = statusFilter
		? enrollments.filter((e) => e.status === statusFilter)
		: enrollments;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex justify-end">
				<Select
					value={statusFilter ?? ENROLLMENT_STATUS_ALL}
					onValueChange={(v) =>
						setStatusFilter(
							v === ENROLLMENT_STATUS_ALL
								? undefined
								: (v as Enrollment['status']),
						)
					}
				>
					<SelectTrigger className="h-9 w-36" size="sm">
						<SelectValue placeholder={t('detail.enrollments.allStatuses')} />
					</SelectTrigger>
					<SelectContent>
						{ENROLLMENT_STATUS_FILTER_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.value === ENROLLMENT_STATUS_ALL
									? tc('state.all')
									: statusLabel('enrollment', opt.value)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<DataTable
				columns={columns}
				data={visibleEnrollments}
				getRowId={(row) => String(row.id)}
				emptyState={
					<div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
						{statusFilter
							? t('detail.enrollments.emptyFiltered')
							: t('detail.enrollments.empty')}
					</div>
				}
			/>
		</div>
	);
}

// ─── Wallet tab ───────────────────────────────────────────────────────────────

function WalletTab({ studentId }: { studentId: number }) {
	return <WalletSection studentId={studentId} />;
}

/** Mirrors the `tab` union validated on the route. */
type StudentTab =
	| 'overview'
	| 'guardians'
	| 'enrollments'
	| 'performance'
	| 'grades'
	| 'billing'
	| 'wallet';

interface StudentDetailPageProps {
	studentId: number;
}

export function StudentDetailPage({ studentId }: StudentDetailPageProps) {
	const t = useAppT('people');
	const tc = useT('common');
	const navigate = useNavigate();
	const { tab } = useSearch({ from: '/_authed/students/$id' });
	const { can, permissionsLoaded } = usePermissions();
	const [editOpen, setEditOpen] = useState(false);
	const { data: student } = useStudent(studentId);
	// A student is opened from the list, from a lead, and from a group roster,
	// so Back follows history; the list is only the fallback for a direct hit.
	const goBack = useGoBack({ to: '/students' });

	const fullName = student
		? `${student.user.firstName} ${student.user.lastName}`.trim()
		: undefined;

	// Wallet is the one tab behind a permission, so `?tab=wallet` in a shared
	// link can name a tab this viewer has neither a trigger nor a body for —
	// which would render the strip with nothing selected under it. Fail open
	// while the catalog is still loading, as the sidebar does.
	const activeTab =
		tab === 'wallet' && permissionsLoaded && !can('wallet.read')
			? 'overview'
			: (tab ?? 'overview');

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-5">
			<PageNav
				onBack={goBack}
				backLabel={tc('action.back')}
				crumbs={[
					{ label: t('title'), link: <Link to="/students" /> },
					// Falls back to the code while the profile loads, so the
					// trail never collapses and then jumps a row taller.
					{ label: fullName || `#${studentId}` },
				]}
			/>

			<StudentHeader studentId={studentId} onEdit={() => setEditOpen(true)} />

			<Tabs
				value={activeTab}
				onValueChange={(next) =>
					void navigate({
						to: '/students/$id',
						params: { id: String(studentId) },
						search: {
							tab: next === 'overview' ? undefined : (next as StudentTab),
						},
						replace: true,
					})
				}
				variant="underline"
			>
				<TabsList>
					<TabsTrigger value="overview">{t('detail.tab.overview')}</TabsTrigger>
					<TabsTrigger value="guardians">
						{t('detail.tab.guardians')}
					</TabsTrigger>
					<TabsTrigger value="enrollments">
						{t('detail.tab.enrollments')}
					</TabsTrigger>
					<TabsTrigger value="performance">
						{t('detail.tab.performance')}
					</TabsTrigger>
					<TabsTrigger value="grades">{t('detail.tab.grades')}</TabsTrigger>
					<TabsTrigger value="billing">{t('detail.tab.billing')}</TabsTrigger>
					<Can permission="wallet.read">
						<TabsTrigger value="wallet">{t('detail.tab.wallet')}</TabsTrigger>
					</Can>
				</TabsList>

				<div className="mt-4">
					<TabsContent value="overview">
						<OverviewTab studentId={studentId} />
					</TabsContent>
					<TabsContent value="guardians">
						<GuardiansTab studentId={studentId} />
					</TabsContent>
					<TabsContent value="enrollments">
						<EnrollmentsTab studentId={studentId} />
					</TabsContent>
					<TabsContent value="performance">
						<PerformanceTab studentId={studentId} />
					</TabsContent>
					<TabsContent value="grades">
						<GradesTab studentId={studentId} />
					</TabsContent>
					<TabsContent value="billing">
						<BillingTab studentId={studentId} />
					</TabsContent>
					<Can permission="wallet.read">
						<TabsContent value="wallet">
							<WalletTab studentId={studentId} />
						</TabsContent>
					</Can>
				</div>
			</Tabs>

			{student && (
				<StudentForm
					mode="edit"
					open={editOpen}
					onOpenChange={setEditOpen}
					student={student}
				/>
			)}
		</div>
	);
}
