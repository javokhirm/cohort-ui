import { LayoutGrid } from 'lucide-react';

import { branchDotClass, cn, EmptyState, Skeleton } from '@repo/ui';

import { useTeachBranches } from '@/api/branches';
import { useGroups } from '@/features/groups/api/groups.queries';
import type { TeachGroup } from '@/features/groups/api/groups.queries';
import { useBranchFilter } from '@/store/branchStore';

/** "Mon, Wed, Fri · 09:00–10:30", or nothing when the group has no schedule rule. */
function scheduleSummary(group: TeachGroup): string | null {
	const rule = group.scheduleRule;
	if (!rule) return null;
	const days = rule.days
		.map((day) => day.slice(0, 1) + day.slice(1, 3).toLowerCase())
		.join(', ');
	return `${days} · ${rule.startTime}–${rule.endTime}`;
}

/**
 * The groups this teacher teaches (`GET /teach/groups`, api-reference §4.2),
 * narrowed to the branch picked in the topbar switcher — client-side, since the
 * endpoint takes no branch param.
 *
 * Each card carries its branch dot, in the same color the switcher gives that
 * branch (`branchDotClass` keys on the branch id), so "which of my places is
 * this?" is answerable without reading the filter.
 */
export function GroupsRoute() {
	const { data: branches } = useTeachBranches();
	const { data, isPending, isError } = useGroups();
	const filterByBranch = useBranchFilter();

	const groups = data ? filterByBranch(data.rows) : [];
	const hiddenByBranch = (data?.rows.length ?? 0) - groups.length;

	/** Only worth showing a branch on a card when the teacher works at more than one. */
	const showBranch = (branches?.length ?? 0) > 1;
	const branchName = (id: number) => branches?.find((b) => b.id === id)?.name;

	if (isPending) {
		return (
			<div className="mx-auto w-full max-w-5xl space-y-3">
				<Skeleton className="h-24 w-full rounded-2xl" />
				<Skeleton className="h-24 w-full rounded-2xl" />
				<Skeleton className="h-24 w-full rounded-2xl" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<LayoutGrid />}
						title="Couldn't load your groups"
						description="Something went wrong fetching the groups you teach. Try again in a moment."
					/>
				</div>
			</div>
		);
	}

	if (groups.length === 0) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<LayoutGrid />}
						title={
							hiddenByBranch > 0
								? 'No groups at this branch'
								: 'No groups yet'
						}
						description={
							hiddenByBranch > 0
								? 'You teach elsewhere — switch to "All branches" in the topbar to see those groups.'
								: 'Groups you are assigned to teach will appear here.'
						}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-5xl">
			<p className="text-[13px] text-muted-foreground">
				{groups.length === 1 ? '1 group' : `${groups.length} groups`}
				{hiddenByBranch > 0 && ` · ${hiddenByBranch} hidden by the branch filter`}
			</p>

			<div className="mt-4 space-y-3">
				{groups.map((group) => {
					const schedule = scheduleSummary(group);
					return (
						<div
							key={group.id}
							className="rounded-2xl border border-border bg-card p-3.5 shadow-sm"
						>
							<div className="min-w-0">
								<div className="truncate text-[15px] font-bold text-foreground">
									{group.name}
								</div>
								<div className="truncate text-[12.5px] text-muted-foreground">
									{group.courseName}
									{group.roomName && ` · ${group.roomName}`}
								</div>
							</div>

							{(schedule ?? showBranch) && (
								<div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
									{schedule && <span>{schedule}</span>}
									{showBranch && (
										<span className="flex items-center gap-1.5">
											<span
												className={cn(
													'size-1.75 shrink-0 rounded-full',
													branchDotClass(group.branchId),
												)}
											/>
											{branchName(group.branchId) ??
												'Unknown branch'}
										</span>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
