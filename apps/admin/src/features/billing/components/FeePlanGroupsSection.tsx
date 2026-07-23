import { Users } from 'lucide-react';

import { Spinner, StatusBadge } from '@repo/ui';
import { useAppT } from '@/locales';

import { GROUP_STATUS_TONES } from '@/features/groups/lib/group-options';

import { useFeePlanGroups } from '../api/fee-plans.queries';

/**
 * Read-only list of the groups billing on a fee plan, shown inside the edit
 * sheet. Groups are never assigned to a plan from here — a group reaches its
 * plan through its course (`group.courseId → courses.feePlanId`), so this
 * answers "what does changing this plan affect?" and nothing more.
 */
export function FeePlanGroupsSection({ feePlanId }: { feePlanId: number }) {
	const t = useAppT('billing');
	const tg = useAppT('groups');
	const { data, isLoading, isError } = useFeePlanGroups(feePlanId);
	const groups = data?.rows ?? [];

	return (
		<div className="flex flex-col gap-3 rounded-xl bg-card p-4">
			<div className="flex items-center gap-2">
				<Users className="size-4 text-muted-foreground" />
				<span className="text-sm font-medium">
					{t('feePlanExtra.groupsUsing')}
				</span>
			</div>

			{isLoading ? (
				<div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
					<Spinner className="size-4" />
					Loading groups…
				</div>
			) : isError ? (
				<p className="text-sm text-destructive">
					Failed to load groups. Please refresh.
				</p>
			) : groups.length === 0 ? (
				<p className="text-xs text-muted-foreground">
					No groups bill on this plan yet. A group inherits it from its course —
					attach the plan when you create or edit a course.
				</p>
			) : (
				<>
					<ul className="divide-y divide-border rounded-lg border">
						{groups.map((g) => (
							<li
								key={g.id}
								className="flex items-center justify-between gap-3 px-3 py-2.5"
							>
								<div className="flex min-w-0 flex-col">
									<span className="truncate text-sm font-medium">
										{g.name}
									</span>
									<span className="truncate text-xs text-muted-foreground">
										{g.courseName}
									</span>
								</div>
								<StatusBadge tone={GROUP_STATUS_TONES[g.status]}>
									{tg(`status.${g.status}`)}
								</StatusBadge>
							</li>
						))}
					</ul>
					<p className="text-xs text-muted-foreground">
						Changing the amount or cycle re-prices every future invoice for
						these groups. Invoices already issued keep their original plan.
					</p>
				</>
			)}
		</div>
	);
}
