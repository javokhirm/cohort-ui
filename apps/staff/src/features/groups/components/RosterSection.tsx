import { useState } from 'react';
import { Plus, UserMinus, Users } from 'lucide-react';

import {
	Button,
	Card,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	EmptyState,
	Label,
	Skeleton,
	Spinner,
	StatusBadge,
	Textarea,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatDate } from '@repo/utils';

import { useGroupEnrollments, type Enrollment } from '../api/groups.queries';
import { useUpdateEnrollment } from '../api/groups.mutations';
import { EnrollStudentsDialog } from './EnrollStudentsDialog';

interface RosterSectionProps {
	groupId: number;
	capacity: number | null;
}

export function RosterSection({ groupId, capacity }: RosterSectionProps) {
	const { data: enrollments = [], isLoading } = useGroupEnrollments(groupId);
	const [enrollOpen, setEnrollOpen] = useState(false);
	const [dropTarget, setDropTarget] = useState<Enrollment | null>(null);

	const activeCount = enrollments.filter((e) => e.status === 'ACTIVE').length;
	const enrolledIds = enrollments
		.filter((e) => e.status === 'ACTIVE')
		.map((e) => e.studentId);

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
				<Button size="sm" onClick={() => setEnrollOpen(true)}>
					<Plus className="mr-1.5 size-4" />
					Enroll students
				</Button>
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
							<Button size="sm" onClick={() => setEnrollOpen(true)}>
								<Plus className="mr-1.5 size-4" />
								Enroll students
							</Button>
						}
					/>
				</Card>
			) : (
				<Card className="gap-0 divide-y divide-border py-0">
					{enrollments.map((e) => (
						<div
							key={e.id}
							className="flex items-center justify-between gap-4 px-4 py-3"
						>
							<div className="flex flex-col">
								<span className="text-sm font-medium">
									{e.studentName}
								</span>
								<span className="font-mono text-xs text-muted-foreground">
									{e.studentCode} · enrolled {formatDate(e.enrolledAt)}
								</span>
							</div>
							<div className="flex items-center gap-3">
								<StatusBadge kind="enrollment" status={e.status} />
								{e.status === 'ACTIVE' && (
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
						</div>
					))}
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
