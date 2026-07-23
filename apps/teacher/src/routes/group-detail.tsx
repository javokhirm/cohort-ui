import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

import {
	Button,
	EmptyState,
	PageHeader,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@repo/ui';

import { useTeachBranches } from '@/api/branches';
import { useGroup } from '@/features/groups/api/groups.queries';
import { GroupHeaderCard } from '@/features/groups/components/GroupHeaderCard';
import { GroupRosterTab } from '@/features/groups/components/GroupRosterTab';
import { GroupGradingTab } from '@/features/marks/components/GroupGradingTab';
import { GroupScheduleTab } from '@/features/schedule/components/GroupScheduleTab';
import { useAppT } from '@/locales';

/** The group screen's tabs. `roster` is the default and stays out of the URL. */
export type GroupTab = 'roster' | 'schedule' | 'grading';

/**
 * One group's screen: a header of the facts a teacher checks before class, then
 * Roster / Schedule / Grading — each tab its own endpoint, each owning its own
 * query and its own loading, error and empty states.
 *
 * The active tab lives in `?tab=`, matching how `month` and `view` are already
 * URL-driven on the group grids: a teacher who opens a student from the Roster
 * and comes back should land on the Roster, not be reset.
 *
 * The tabs are read-only. The two writes reachable from here — the attendance
 * and marks grids — are buttons on the header card.
 */
export function GroupDetailRoute() {
	const t = useAppT('groups');
	const navigate = useNavigate();
	const { groupId: groupIdParam } = useParams({ from: '/_authed/groups/$groupId' });
	const { tab } = useSearch({ from: '/_authed/groups/$groupId' });
	const groupId = Number(groupIdParam);

	const { data: group, isPending, isError } = useGroup(groupId);
	const { data: branches } = useTeachBranches();

	const backToGroups = () => void navigate({ to: '/groups' });

	const header = (
		<div className="flex flex-col gap-3">
			<Button
				variant="ghost"
				size="sm"
				className="w-fit -ml-2 text-muted-foreground"
				onClick={backToGroups}
			>
				<ArrowLeft className="size-3.5" />
				{t('back')}
			</Button>
			<PageHeader title={group?.name ?? 'Group'} description={group?.courseName} />
		</div>
	);

	if (isPending) {
		return (
			<div className="mx-auto flex w-full max-w-230 flex-col gap-4 pb-6">
				{header}
				<Skeleton className="h-38 w-full rounded-xl" />
				<Skeleton className="h-9 w-56 rounded-xl" />
				<Skeleton className="h-16 w-full rounded-xl" />
				<Skeleton className="h-16 w-full rounded-xl" />
			</div>
		);
	}

	if (isError || !group) {
		return (
			<div className="mx-auto flex w-full max-w-230 flex-col gap-4 pb-6">
				{header}
				<div className="rounded-xl border border-border bg-card">
					<EmptyState
						icon={<LayoutGrid />}
						title={t('notFoundTitle')}
						description={t('notFoundDescription')}
						action={
							<Button variant="outline" size="sm" onClick={backToGroups}>
								{t('back')}
							</Button>
						}
					/>
				</div>
			</div>
		);
	}

	const goToTab = (next: string) =>
		void navigate({
			to: '/groups/$groupId',
			params: { groupId: groupIdParam },
			search: { tab: next === 'roster' ? undefined : (next as GroupTab) },
		});

	return (
		<div className="mx-auto flex w-full max-w-230 flex-col gap-4 pb-6">
			{header}

			<GroupHeaderCard
				group={group}
				branchName={branches?.find((b) => b.id === group.branchId)?.name}
				onOpenAttendance={() =>
					void navigate({
						to: '/groups/$groupId/attendance',
						params: { groupId: groupIdParam },
						search: { month: undefined, view: undefined },
					})
				}
				onOpenMarks={() =>
					void navigate({
						to: '/groups/$groupId/marks',
						params: { groupId: groupIdParam },
						search: { month: undefined, view: undefined },
					})
				}
			/>

			<Tabs value={tab ?? 'roster'} onValueChange={goToTab} className="gap-4">
				{/* Scrolls rather than wrapping at 375px. */}
				<TabsList className="w-full max-w-sm overflow-x-auto">
					<TabsTrigger value="roster">Roster</TabsTrigger>
					<TabsTrigger value="schedule">Schedule</TabsTrigger>
					<TabsTrigger value="grading">Grading</TabsTrigger>
				</TabsList>

				<TabsContent value="roster">
					<GroupRosterTab
						groupId={groupId}
						onOpenStudent={(studentId) =>
							void navigate({
								to: '/students/$studentId',
								params: { studentId: String(studentId) },
							})
						}
					/>
				</TabsContent>

				<TabsContent value="schedule">
					<GroupScheduleTab
						groupId={groupId}
						onOpenSession={(sessionId) =>
							void navigate({
								to: '/sessions/$sessionId/attendance',
								params: { sessionId: String(sessionId) },
								search: { view: undefined },
							})
						}
					/>
				</TabsContent>

				<TabsContent value="grading">
					<GroupGradingTab groupId={groupId} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
