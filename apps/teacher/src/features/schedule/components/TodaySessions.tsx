import { CalendarDays, ClipboardCheck, Star } from 'lucide-react';

import { EmptyState, SessionCard, Skeleton } from '@repo/ui';
import { formatTime } from '@repo/utils';

import type { TeachSession } from '../api/sessions.queries';

interface TodaySessionsProps {
	isPending: boolean;
	isError: boolean;
	/** Sessions for the selected day, already branch-filtered. */
	sessions: TeachSession[];
	/** How many of the selected day's sessions the branch filter is hiding. */
	hiddenByBranch: number;
	/** When the selected day has no shown sessions, e.g. "today" or "on Fri, 18 Jul". */
	emptyWhen: string;
	onTakeAttendance: (sessionId: number) => void;
	onEnterMarks: (sessionId: number) => void;
}

/**
 * The selected day's session list with its own loading / error / empty states.
 * Each card opens the session (whole-card tap → detail); scheduled and completed
 * sessions also expose "Attendance" and "Marks" actions. Cancelled sessions are
 * dimmed and carry no actions.
 */
export function TodaySessions({
	isPending,
	isError,
	sessions,
	hiddenByBranch,
	emptyWhen,
	onTakeAttendance,
	onEnterMarks,
}: TodaySessionsProps) {
	if (isPending) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-32 w-full rounded-2xl" />
				<Skeleton className="h-32 w-full rounded-2xl" />
				<Skeleton className="h-32 w-full rounded-2xl" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<CalendarDays />}
					title="Couldn't load your schedule"
					description="Something went wrong fetching your sessions. Try again in a moment."
				/>
			</div>
		);
	}

	if (sessions.length === 0) {
		return (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<CalendarDays />}
					title={
						hiddenByBranch > 0
							? 'No classes at this branch'
							: `No classes ${emptyWhen}`
					}
					description={
						hiddenByBranch > 0
							? 'You do teach elsewhere — switch to "All branches" in the topbar to see those.'
							: 'Enjoy the break. Your next teaching day is dotted on the strip above.'
					}
				/>
			</div>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{sessions.map((session) => {
				const isCancelled = session.status === 'CANCELLED';
				return (
					<SessionCard
						key={session.id}
						startTime={formatTime(session.startTime)}
						endTime={formatTime(session.endTime)}
						groupName={session.groupName}
						courseName={session.courseName}
						room={session.roomName ?? undefined}
						topic={session.topic ?? undefined}
						status={session.status}
						studentCount={session.studentCount}
						className={isCancelled ? 'opacity-60' : undefined}
						actions={
							isCancelled
								? undefined
								: [
										{
											label: 'Attendance',
											icon: <ClipboardCheck className="size-4" />,
											variant: 'outline',
											onClick: (e) => {
												e.stopPropagation();
												onTakeAttendance(session.id);
											},
										},
										{
											label: 'Marks',
											icon: <Star className="size-4" />,
											variant: 'default',
											onClick: (e) => {
												e.stopPropagation();
												onEnterMarks(session.id);
											},
										},
									]
						}
					/>
				);
			})}
		</div>
	);
}
