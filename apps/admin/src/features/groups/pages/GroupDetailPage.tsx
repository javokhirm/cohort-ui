import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowLeft, CalendarDays } from 'lucide-react';

import {
	Button,
	EmptyState,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@repo/ui';
import { useAppT } from '@/locales';

import { useGroup } from '../api/groups.queries';
import { GroupActions } from '../components/GroupActions';
import { GroupHeaderCard } from '../components/GroupHeaderCard';
import { GroupSessionsSection } from '../components/GroupSessionsSection';
import { RosterSection } from '../components/RosterSection';

/** The group screen's tabs. `students` is the default and stays out of the URL. */
export type GroupTab = 'students' | 'schedule';

interface GroupDetailPageProps {
	groupId: number;
}

/**
 * One group's screen: a header carrying every fact about the group, then
 * Students / Schedule.
 *
 * There is no Overview tab. It restated the header — course, schedule, capacity
 * and a date range that all appeared above it — so the page said the same
 * things two and three times, and its enrolled figure could disagree with the
 * roster's. Everything the tab held now lives in the header, exactly once.
 *
 * The active tab lives in `?tab=`, like the teacher console's group screen and
 * this app's own `/schedule?view=`: an admin who opens a student from the roster
 * or edits the group and comes back should land where they were.
 */
export function GroupDetailPage({ groupId }: GroupDetailPageProps) {
	const t = useAppT('groups');
	const navigate = useNavigate();
	const { tab } = useSearch({ from: '/_authed/groups/$groupId' });
	const { data: group, isLoading, isError } = useGroup(groupId);

	const back = (
		<Link
			to="/groups"
			className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft className="size-3.5" />
			{t('back')}
		</Link>
	);

	if (isLoading) {
		return (
			<div className="mx-auto flex max-w-7xl flex-col gap-5">
				{back}
				<Skeleton className="h-56 w-full rounded-xl" />
				<Skeleton className="h-9 w-56" />
				<Skeleton className="h-40 w-full rounded-xl" />
			</div>
		);
	}

	if (isError || !group) {
		return (
			<div className="mx-auto flex max-w-7xl flex-col gap-5">
				{back}
				<div className="rounded-xl border bg-card">
					<EmptyState
						icon={<CalendarDays />}
						title={t('detail.notFound')}
						description={t('detail.notFoundDescription')}
						action={
							<Button
								variant="outline"
								size="sm"
								onClick={() => void navigate({ to: '/groups' })}
							>
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
			params: { groupId: String(group.id) },
			search: { tab: next === 'students' ? undefined : (next as GroupTab) },
		});

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-5">
			{back}

			<GroupHeaderCard group={group} actions={<GroupActions group={group} />} />

			<Tabs
				value={tab ?? 'students'}
				onValueChange={goToTab}
				className="gap-4"
				variant="underline"
			>
				<TabsList>
					<TabsTrigger value="students">{t('detail.tab.students')}</TabsTrigger>
					<TabsTrigger value="schedule">{t('detail.tab.schedule')}</TabsTrigger>
				</TabsList>

				<TabsContent value="students">
					<RosterSection groupId={group.id} capacity={group.capacity} />
				</TabsContent>
				<TabsContent value="schedule">
					<GroupSessionsSection groupId={group.id} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
