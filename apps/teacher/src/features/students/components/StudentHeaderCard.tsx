import { Avatar, AvatarFallback, StatusBadge } from '@repo/ui';
import { useStatusLabel } from '@repo/i18n';

import type { TeachStudentProfile } from '../api/students.queries';
import { fullName, initials } from '../lib/student-name';
import { useAppT } from '@/locales';

interface StudentHeaderCardProps {
	student: TeachStudentProfile;
}

/** Identity block at the top of the student screen: who this is, and standing. */
export function StudentHeaderCard({ student }: StudentHeaderCardProps) {
	const t = useAppT('students');
	const statusLabel = useStatusLabel();
	return (
		<div className="flex items-center gap-3.25 rounded-xl border border-border bg-card p-4 shadow-xs">
			<Avatar className="size-14 rounded-xl">
				<AvatarFallback className="rounded-xl text-[19px] font-bold">
					{initials(student.firstName, student.lastName)}
				</AvatarFallback>
			</Avatar>

			<div className="min-w-0 flex-1">
				<div className="truncate text-[17px] font-bold text-foreground">
					{fullName(student.firstName, student.lastName, t('unnamedStudent'))}
				</div>
				<div className="truncate font-mono text-[12px] text-muted-foreground/70">
					{student.studentCode}
				</div>
				<div className="mt-1.75">
					<StatusBadge kind="student" status={student.status}>
						{statusLabel('student', student.status)}
					</StatusBadge>
				</div>
			</div>
		</div>
	);
}
