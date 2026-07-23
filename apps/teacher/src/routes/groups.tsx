import { LayoutGrid } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { EmptyState, Skeleton } from '@repo/ui';

import { useTeachBranches } from '@/api/branches';
import { GroupCard } from '@/features/groups/components/GroupCard';
import { useGroups } from '@/features/groups/api/groups.queries';
import { useBranchFilter } from '@/store/branchStore';
import { useAppT } from '@/locales';

/**
 * The groups this teacher teaches (`GET /teach/groups`, api-reference §4.2),
 * narrowed to the branch picked in the topbar switcher — client-side, since the
 * endpoint takes no branch param.
 *
 * Laid out as the design's card grid: one column on a phone, two from `md` up
 * (where the shell switches to its desktop chrome). Tapping a card opens that
 * group's screen — roster, schedule and grading — which is also where the
 * attendance and marks grids are reached from.
 */
export function GroupsRoute() {
	const t = useAppT('groups');
	const navigate = useNavigate();
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
			<div className="mx-auto w-full max-w-230">
				<Skeleton className="h-4 w-24" />
				<div className="mt-4 grid gap-2.75 md:grid-cols-2">
					<Skeleton className="h-33 w-full rounded-xl" />
					<Skeleton className="h-33 w-full rounded-xl" />
					<Skeleton className="h-33 w-full rounded-xl" />
					<Skeleton className="h-33 w-full rounded-xl" />
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="mx-auto w-full max-w-230">
				<div className="rounded-xl border border-border bg-card">
					<EmptyState
						icon={<LayoutGrid />}
						title={t('errorTitle')}
						description={t('errorDescription')}
					/>
				</div>
			</div>
		);
	}

	if (groups.length === 0) {
		return (
			<div className="mx-auto w-full max-w-230">
				<div className="rounded-xl border border-border bg-card">
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
		<div className="mx-auto w-full max-w-230 pb-6">
			<p className="text-[13px] text-muted-foreground">
				{groups.length === 1 ? '1 group' : `${groups.length} groups`}
				{hiddenByBranch > 0 && ` · ${hiddenByBranch} hidden by the branch filter`}
			</p>

			<div className="mt-4 grid gap-2.75 md:grid-cols-2">
				{groups.map((group) => (
					<GroupCard
						key={group.id}
						group={group}
						branchName={
							showBranch
								? (branchName(group.branchId) ?? 'Unknown branch')
								: undefined
						}
						onOpen={() =>
							void navigate({
								to: '/groups/$groupId',
								params: { groupId: String(group.id) },
								search: { tab: undefined },
							})
						}
					/>
				))}
			</div>
		</div>
	);
}
