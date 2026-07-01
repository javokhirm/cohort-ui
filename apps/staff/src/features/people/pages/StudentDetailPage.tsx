import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Edit, MessageSquare, Plus, Trash2 } from 'lucide-react';

import {
	Button,
	Card,
	CardContent,
	DataTable,
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
import { formatDate, formatMoney } from '@repo/utils';

import {
	useStudent,
	useStudentGuardians,
	useStudentEnrollments,
	useStudentAttendances,
	useStudentResults,
	useStudentInvoices,
	useBranches,
} from '../api/students.queries';
import type {
	Guardian,
	Enrollment,
	Grade,
	Invoice,
	AttendanceRecord,
} from '../api/students.queries';
import { useRemoveGuardian } from '../api/students.mutations';
import { StudentForm } from '../components/StudentForm';

function genderLabel(g?: string | null) {
	if (g === 'M') return 'Male';
	if (g === 'F') return 'Female';
	if (g === 'O') return 'Other';
	return '—';
}

// ─── Student header ───────────────────────────────────────────────────────────

function StudentHeader({ studentId, onEdit }: { studentId: number; onEdit: () => void }) {
	const { data: student, isLoading } = useStudent(studentId);
	const { data: branches = [] } = useBranches();

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
							<StatusBadge kind="student" status={student.status} />
						</div>
						<div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
							<span>{student.studentCode}</span>
							<span>·</span>
							<span>{branchName}</span>
							<span>·</span>
							<span>{student.user.phone}</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={onEdit}>
						<Edit className="mr-1.5 size-3.5" />
						Edit
					</Button>
					<Button variant="outline" size="sm">
						<MessageSquare className="mr-1.5 size-3.5" />
						Message
					</Button>
					<Button size="sm">
						<Plus className="mr-1.5 size-3.5" />
						Create invoice
					</Button>
				</div>
			</div>
		</div>
	);
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ studentId }: { studentId: number }) {
	const { data: student } = useStudent(studentId);
	if (!student) return null;

	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<Card className="lg:col-span-2">
				<CardContent className="pt-5">
					<p className="mb-4 font-semibold">Personal details</p>
					<div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
						<div>
							<p className="text-muted-foreground">Date of birth</p>
							<p className="mt-0.5 font-medium">
								{student.dateOfBirth
									? formatDate(student.dateOfBirth)
									: '—'}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Address</p>
							<p className="mt-0.5 font-medium">{student.address ?? '—'}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Gender</p>
							<p className="mt-0.5 font-medium">
								{genderLabel(student.gender)}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Enrollment date</p>
							<p className="mt-0.5 font-medium">
								{formatDate(student.enrolledAt)}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Emergency contact</p>
							<p className="mt-0.5 font-medium">
								{student.emergencyContact?.phone ?? '—'}
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
	const { data: guardians = [], isLoading } = useStudentGuardians(studentId);
	const removeGuardian = useRemoveGuardian();

	function handleRemove(guardian: Guardian) {
		if (
			!confirm(
				`Remove ${guardian.user.firstName} ${guardian.user.lastName} as guardian?`,
			)
		)
			return;
		removeGuardian.mutate(
			{ studentId, guardianId: guardian.id },
			{
				onSuccess: () => toast.success('Guardian removed'),
			},
		);
	}

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
			<div className="flex min-h-32 items-center justify-center rounded-xl border text-sm text-muted-foreground">
				No guardians linked
			</div>
		);
	}

	return (
		<div className="rounded-xl border bg-card">
			{guardians.map((g, i) => {
				const initials =
					`${g.user.firstName[0] ?? ''}${g.user.lastName[0] ?? ''}`.toUpperCase();
				const relationLabel =
					g.relation.charAt(0).toUpperCase() + g.relation.slice(1);
				return (
					<div key={g.id}>
						{i > 0 && <Separator />}
						<div className="flex items-center justify-between p-4">
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
												Primary
											</StatusBadge>
										)}
										{g.canPickup && (
											<StatusBadge tone="green">
												Pickup OK
											</StatusBadge>
										)}
									</div>
									<div className="mt-0.5 text-sm text-muted-foreground">
										{g.user.phone}
									</div>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="text-muted-foreground hover:text-destructive"
								onClick={() => handleRemove(g)}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ─── Enrollments tab ──────────────────────────────────────────────────────────

const enrollmentColumns: ColumnDef<Enrollment>[] = [
	{
		accessorKey: 'groupCode',
		header: 'Group',
		cell: ({ getValue }) => (
			<span className="font-mono text-xs">{getValue<string>()}</span>
		),
	},
	{
		accessorKey: 'courseName',
		header: 'Course',
		cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
	},
	{
		accessorKey: 'enrolledAt',
		header: 'From',
		cell: ({ getValue }) => (
			<span className="text-muted-foreground">
				{formatDate(getValue<string>())}
			</span>
		),
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ getValue }) => (
			<StatusBadge kind="enrollment" status={getValue<string>()} />
		),
	},
];

function EnrollmentsTab({ studentId }: { studentId: number }) {
	const { data: enrollments = [], isLoading } = useStudentEnrollments(studentId);

	if (isLoading) {
		return <Skeleton className="h-32 rounded-xl" />;
	}

	return (
		<DataTable
			columns={enrollmentColumns}
			data={enrollments}
			getRowId={(row) => String(row.id)}
			emptyState={
				<div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
					No enrollments
				</div>
			}
		/>
	);
}

// ─── Attendance tab ───────────────────────────────────────────────────────────

function AttendanceTab({ studentId }: { studentId: number }) {
	const { data: attendance, isLoading } = useStudentAttendances(studentId);

	if (isLoading) {
		return <Skeleton className="h-32 rounded-xl" />;
	}

	const records: AttendanceRecord[] = attendance?.records ?? [];
	const rate = attendance?.rate;

	if (records.length === 0) {
		return (
			<div className="flex min-h-32 items-center justify-center rounded-xl border text-sm text-muted-foreground">
				No attendance records
			</div>
		);
	}

	return (
		<div className="grid gap-4 lg:grid-cols-4">
			{rate != null && (
				<Card>
					<CardContent className="flex flex-col items-center justify-center pt-6 text-center">
						<p className="text-sm text-muted-foreground">Attendance rate</p>
						<p className="mt-1 text-4xl font-bold text-green-600">{rate}%</p>
						<p className="mt-1 text-xs text-muted-foreground">Last 90 days</p>
					</CardContent>
				</Card>
			)}
			<div
				className={`rounded-xl border bg-card ${rate != null ? 'lg:col-span-3' : 'lg:col-span-4'}`}
			>
				{records.map((r: AttendanceRecord, i) => (
					<div key={r.id}>
						{i > 0 && <Separator />}
						<div className="flex items-center justify-between px-4 py-3">
							<div>
								<p className="text-sm font-medium">{r.courseName}</p>
								<p className="text-xs text-muted-foreground">
									{formatDate(r.sessionDate)}
								</p>
							</div>
							<StatusBadge kind="attendance" status={r.status} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Grades tab ───────────────────────────────────────────────────────────────

function GradesTab({ studentId }: { studentId: number }) {
	const { data: grades = [], isLoading } = useStudentResults(studentId);

	if (isLoading) {
		return <Skeleton className="h-32 rounded-xl" />;
	}

	if (grades.length === 0) {
		return (
			<div className="flex min-h-32 items-center justify-center rounded-xl border text-sm text-muted-foreground">
				No grades recorded
			</div>
		);
	}

	return (
		<div className="rounded-xl border bg-card">
			{(grades as Grade[]).map((g: Grade, i) => (
				<div key={g.id}>
					{i > 0 && <Separator />}
					<div className="flex items-center justify-between px-4 py-3">
						<div>
							<p className="text-sm font-medium">{g.assessmentName}</p>
							<p className="text-xs text-muted-foreground">
								{formatDate(g.date)}
							</p>
						</div>
						<div className="text-right">
							<span className="text-base font-bold">{g.score}</span>
							<span className="text-sm text-muted-foreground">
								{' '}
								/ {g.maxScore}
							</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Billing tab ──────────────────────────────────────────────────────────────

const invoiceColumns: ColumnDef<Invoice>[] = [
	{
		accessorKey: 'invoiceCode',
		header: 'Invoice',
		cell: ({ getValue }) => (
			<span className="font-mono text-xs">{getValue<string>()}</span>
		),
	},
	{
		accessorKey: 'date',
		header: 'Date',
		cell: ({ getValue }) => (
			<span className="text-muted-foreground">
				{formatDate(getValue<string>())}
			</span>
		),
	},
	{
		accessorKey: 'total',
		header: () => <div className="text-right">Total</div>,
		cell: ({ getValue }) => (
			<div className="text-right font-medium">
				{formatMoney(getValue<number>())}
			</div>
		),
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ getValue }) => (
			<StatusBadge kind="invoice" status={getValue<string>()} />
		),
	},
];

function BillingTab({ studentId }: { studentId: number }) {
	const { data: invoices = [], isLoading } = useStudentInvoices(studentId);

	if (isLoading) {
		return <Skeleton className="h-32 rounded-xl" />;
	}

	return (
		<DataTable
			columns={invoiceColumns}
			data={invoices as Invoice[]}
			getRowId={(row) => String(row.id)}
			emptyState={
				<div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
					No invoices
				</div>
			}
		/>
	);
}

interface StudentDetailPageProps {
	studentId: number;
}

export function StudentDetailPage({ studentId }: StudentDetailPageProps) {
	const [editOpen, setEditOpen] = useState(false);
	const { data: student } = useStudent(studentId);

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-5">
			<Link
				to="/students"
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Back to students
			</Link>

			<StudentHeader studentId={studentId} onEdit={() => setEditOpen(true)} />

			<Tabs defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="guardians">Guardians</TabsTrigger>
					<TabsTrigger value="enrollments">Enrollments</TabsTrigger>
					<TabsTrigger value="attendance">Attendance</TabsTrigger>
					<TabsTrigger value="grades">Grades</TabsTrigger>
					<TabsTrigger value="billing">Billing</TabsTrigger>
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
					<TabsContent value="attendance">
						<AttendanceTab studentId={studentId} />
					</TabsContent>
					<TabsContent value="grades">
						<GradesTab studentId={studentId} />
					</TabsContent>
					<TabsContent value="billing">
						<BillingTab studentId={studentId} />
					</TabsContent>
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
