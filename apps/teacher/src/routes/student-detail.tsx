import { ArrowLeft, CalendarDays, Mail, Phone, User, UserRound } from 'lucide-react';
import { useNavigate, useParams, useRouter } from '@tanstack/react-router';

import { Button, DetailRows, EmptyState, PageHeader, Skeleton } from '@repo/ui';
import { formatDate } from '@repo/utils';

import { useStudent, type StudentGender } from '@/features/students/api/students.queries';
import { GuardianList } from '@/features/students/components/GuardianList';
import { StudentHeaderCard } from '@/features/students/components/StudentHeaderCard';

const GENDER_LABELS: Record<StudentGender, string> = {
	M: 'Male',
	F: 'Female',
	O: 'Other',
};

/** Small caps section label, matching the design's group headings. */
function SectionLabel({ children }: { children: string }) {
	return (
		<div className="mt-4.5 mb-2 px-0.5 text-[11px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
			{children}
		</div>
	);
}

/**
 * A student's profile, read-only (api-reference §4.6): who they are, how to
 * reach them, and who to call in an emergency.
 *
 * The teach surface deliberately serves a narrowed shape — no address, notes or
 * financial data — so there is nothing here to hide behind a permission check.
 */
export function StudentDetailRoute() {
	const navigate = useNavigate();
	const router = useRouter();
	const { studentId: studentIdParam } = useParams({
		from: '/_authed/students/$studentId',
	});
	const studentId = Number(studentIdParam);

	const { data: student, isPending, isError } = useStudent(studentId);

	/** Back to whichever group roster opened this, falling back to Groups. */
	const goBack = () => {
		if (router.history.canGoBack()) {
			router.history.back();
			return;
		}
		void navigate({ to: '/groups' });
	};

	const header = (
		<div className="flex flex-col gap-3">
			<Button
				variant="ghost"
				size="sm"
				className="-ml-2 w-fit text-muted-foreground"
				onClick={goBack}
			>
				<ArrowLeft className="size-3.5" />
				Back
			</Button>
			<PageHeader title="Student profile" />
		</div>
	);

	if (isPending) {
		return (
			<div className="mx-auto flex w-full max-w-190 flex-col gap-4 pb-6">
				{header}
				<Skeleton className="h-22 w-full rounded-xl" />
				<Skeleton className="h-52 w-full rounded-xl" />
			</div>
		);
	}

	if (isError || !student) {
		return (
			<div className="mx-auto flex w-full max-w-190 flex-col gap-4 pb-6">
				{header}
				<div className="rounded-xl border border-border bg-card">
					<EmptyState
						icon={<UserRound />}
						title="Couldn't load this student"
						description="They may not exist, or they may not be enrolled in one of the groups you teach."
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-190 pb-6">
			{header}

			<div className="mt-4">
				<StudentHeaderCard student={student} />
			</div>

			<SectionLabel>Contact</SectionLabel>
			<div className="rounded-xl border border-border bg-card px-3.5 shadow-xs">
				<DetailRows
					rows={[
						{
							label: 'Phone',
							value: student.phone ?? '—',
							icon: <Phone />,
						},
						{
							label: 'Email',
							value: student.email ?? '—',
							icon: <Mail />,
						},
						{
							label: 'Date of birth',
							value: student.dateOfBirth
								? formatDate(student.dateOfBirth)
								: '—',
							icon: <CalendarDays />,
						},
						{
							label: 'Gender',
							value: student.gender ? GENDER_LABELS[student.gender] : '—',
							icon: <User />,
						},
					]}
				/>
			</div>

			<SectionLabel>Guardians</SectionLabel>
			<GuardianList studentId={studentId} />
		</div>
	);
}
