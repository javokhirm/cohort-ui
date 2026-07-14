import { CalendarDays } from 'lucide-react';

import { EmptyState, SessionCard, Skeleton } from '@repo/ui';

import { useSessions } from '@/features/schedule/api/sessions.queries';
import { useBranchFilter } from '@/store/branchStore';
import { useSessionStore } from '@/store/sessionStore';

/** Today as `YYYY-MM-DD` in the viewer's own timezone — the center's local day. */
function today(): string {
	const now = new Date();
	const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 10);
}

/**
 * Today's schedule (`GET /teach/sessions` over a single day, api-reference §4.1),
 * narrowed to the branch picked in the topbar switcher.
 *
 * The branch filter is applied here, in the view, not in the query: `/teach/*`
 * accepts no branch param, so the rows are already in hand and switching branch
 * must not refetch. When a filter hides sessions, the screen says so — a teacher
 * seeing "No classes today" while they are in fact teaching across town is the
 * one failure this screen must not have.
 */
export function TodayRoute() {
	const user = useSessionStore((s) => s.user);
	const filterByBranch = useBranchFilter();

	const date = today();
	const { data, isPending, isError } = useSessions({ from: date, to: date });

	const sessions = data ? filterByBranch(data) : [];
	const hiddenByBranch = (data?.length ?? 0) - sessions.length;

	return (
		<div className="mx-auto w-full max-w-5xl">
			<h1 className="text-[22px] font-bold tracking-tight text-foreground">
				Good morning{user ? `, ${user.firstName}` : ''}
			</h1>

			{!isPending && !isError && (
				<p className="mt-1 text-[13px] text-muted-foreground">
					{sessions.length === 1
						? '1 class today'
						: `${sessions.length} classes today`}
					{hiddenByBranch > 0 &&
						` · ${hiddenByBranch} hidden by the branch filter`}
				</p>
			)}

			{isPending && (
				<div className="mt-5 space-y-3">
					<Skeleton className="h-22 w-full rounded-2xl" />
					<Skeleton className="h-22 w-full rounded-2xl" />
				</div>
			)}

			{isError && (
				<div className="mt-5 rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<CalendarDays />}
						title="Couldn't load your schedule"
						description="Something went wrong fetching today's sessions. Try again in a moment."
					/>
				</div>
			)}

			{!isPending && !isError && sessions.length === 0 && (
				<div className="mt-5 rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<CalendarDays />}
						title={
							hiddenByBranch > 0
								? 'No classes at this branch today'
								: 'No classes today'
						}
						description={
							hiddenByBranch > 0
								? 'You do teach elsewhere today — switch to "All branches" in the topbar to see those.'
								: 'Enjoy the quiet. Your next scheduled session will show up here.'
						}
					/>
				</div>
			)}

			{sessions.length > 0 && (
				<div className="mt-5 space-y-3">
					{sessions.map((session) => (
						<SessionCard
							key={session.id}
							startTime={session.startTime}
							endTime={session.endTime}
							groupName={session.groupName}
							courseName={session.courseName}
							room={session.roomName ?? undefined}
							topic={session.topic ?? undefined}
							status={session.status}
						/>
					))}
				</div>
			)}
		</div>
	);
}
