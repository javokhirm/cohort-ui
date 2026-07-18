import { Phone, ShieldAlert } from 'lucide-react';

import { EmptyState, Skeleton, StatusBadge } from '@repo/ui';

import { useStudentGuardians } from '../api/students.queries';
import { fullName, relationLabel } from '../lib/student-name';

interface GuardianListProps {
	studentId: number;
}

/**
 * The student's guardians (`GET /teach/students/:id/guardians`) —
 * primary first, as the backend orders them.
 *
 * The red-tinted phone chip is hand-built rather than using `DetailRows`: that
 * component's icon chip is fixed to `bg-muted`, and this block is deliberately
 * the one alarming thing on an otherwise neutral screen.
 */
export function GuardianList({ studentId }: GuardianListProps) {
	const { data: guardians, isPending, isError } = useStudentGuardians(studentId);

	if (isPending) {
		return <Skeleton className="h-15 w-full rounded-xl" />;
	}

	if (isError) {
		return (
			<div className="rounded-xl border border-border bg-card">
				<EmptyState
					icon={<ShieldAlert />}
					title="Couldn't load guardians"
					description="Something went wrong fetching this student's guardians. Try again in a moment."
				/>
			</div>
		);
	}

	if (guardians.length === 0) {
		return (
			<div className="rounded-xl border border-border bg-card">
				<EmptyState
					icon={<ShieldAlert />}
					title="No guardians on file"
					description="Ask the front desk to add a guardian for this student."
				/>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
			{guardians.map((guardian) => (
				<div
					key={guardian.guardianUserId}
					className="flex items-center gap-2.75 border-b border-border p-3.25 last:border-0"
				>
					<span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-tone-red-bg text-tone-red-fg">
						<Phone className="size-4" />
					</span>

					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<span className="truncate text-[13.5px] font-semibold text-foreground">
								{fullName(
									guardian.firstName,
									guardian.lastName,
									'Unnamed contact',
								)}
							</span>
							{guardian.isPrimary && (
								<StatusBadge tone="red">Primary</StatusBadge>
							)}
						</div>
						<div className="truncate text-[12px] text-muted-foreground">
							<a
								href={`tel:${guardian.phone}`}
								className="tabular-nums hover:underline"
							>
								{guardian.phone}
							</a>
							{' · '}
							{relationLabel(guardian.relation)}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
