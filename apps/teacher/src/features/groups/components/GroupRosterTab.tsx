import type { KeyboardEvent } from 'react';
import { ChevronRight, Users } from 'lucide-react';

import { Avatar, AvatarFallback, cn, EmptyState, Skeleton, StatusBadge } from '@repo/ui';
import { useStatusLabel } from '@repo/i18n';

import { useGroupStudents, type TeachGroupStudent } from '../api/groups.queries';
import { attendanceToneClass } from '../lib/capacity';
import { fullName, initials } from '../lib/student-name';
import { useAppT } from '@/locales';

interface GroupRosterTabProps {
	groupId: number;
	onOpenStudent: (studentId: number) => void;
}

interface RosterRowProps {
	student: TeachGroupStudent;
	onOpen: () => void;
}

function RosterRow({ student, onOpen }: RosterRowProps) {
	const t = useAppT('groups');
	const tAttendance = useAppT('attendance');
	const statusLabel = useStatusLabel();
	const name = fullName(student.firstName, student.lastName, t('unnamedStudent'));

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		onOpen();
	};

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onOpen}
			onKeyDown={onKeyDown}
			className="flex cursor-pointer items-center gap-2.75 rounded-xl border border-border bg-card p-2.75 shadow-sm transition-colors hover:border-primary active:bg-muted/60 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
		>
			<Avatar className="size-9.5">
				<AvatarFallback className="text-[13px]">
					{initials(student.firstName, student.lastName)}
				</AvatarFallback>
			</Avatar>

			<div className="min-w-0 flex-1">
				<div className="truncate text-[14px] font-semibold text-foreground">
					{name}
				</div>
				<div className="truncate font-mono text-[11px] text-muted-foreground/70">
					{student.studentCode}
				</div>
			</div>

			<div className="shrink-0 text-right">
				<StatusBadge kind="enrollment" status={student.enrollmentStatus}>
					{statusLabel('enrollment', student.enrollmentStatus)}
				</StatusBadge>
				<div className="mt-0.75 text-[11px] font-semibold">
					{student.attendanceRate === null ? (
						<span className="text-muted-foreground">
							{tAttendance('emptyTitle')}
						</span>
					) : (
						<span
							className={cn(
								'tabular-nums',
								attendanceToneClass(student.attendanceRate),
							)}
						>
							{t('attendanceRateShort', { rate: student.attendanceRate })}
						</span>
					)}
				</div>
			</div>

			<ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
		</div>
	);
}

/**
 * The group's roster (`GET /teach/groups/:id/students`). Each row opens that
 * student's profile.
 *
 * `attendanceRate` is `null` until something is marked — that renders as "No
 * attendance yet", never 0%: a student nobody has marked is not a student with
 * perfect absence.
 */
export function GroupRosterTab({ groupId, onOpenStudent }: GroupRosterTabProps) {
	const t = useAppT('groups');
	const { data: students, isPending, isError } = useGroupStudents(groupId);

	if (isPending) {
		return (
			<div className="flex flex-col gap-2">
				<Skeleton className="h-16 w-full rounded-xl" />
				<Skeleton className="h-16 w-full rounded-xl" />
				<Skeleton className="h-16 w-full rounded-xl" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-xl border border-border bg-card">
				<EmptyState
					icon={<Users />}
					title={t('rosterErrorTitle')}
					description={t('rosterErrorDescription')}
				/>
			</div>
		);
	}

	if (students.length === 0) {
		return (
			<div className="rounded-xl border border-border bg-card">
				<EmptyState
					icon={<Users />}
					title={t('rosterEmptyTitle')}
					description={t('rosterEmptyDescription')}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{students.map((student) => (
				<RosterRow
					key={student.studentId}
					student={student}
					onOpen={() => onOpenStudent(student.studentId)}
				/>
			))}
		</div>
	);
}
