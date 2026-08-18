import { Link, useNavigate } from '@tanstack/react-router';
import {
	ArrowLeft,
	CalendarClock,
	CalendarDays,
	DoorOpen,
	Edit,
	GraduationCap,
	Users,
	UserCog,
} from 'lucide-react';

import {
	Button,
	Card,
	DetailRows,
	Separator,
	Skeleton,
	StatCard,
	StatusBadge,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@repo/ui';
import { formatDate } from '@repo/utils';
import { useAppT } from '@/locales';

import { Can } from '@/components/Can';
import { useGroup, type GroupDetail } from '../api/groups.queries';
import { formatScheduleRule, GROUP_STATUS_TONES } from '../lib/group-options';
import { RosterSection } from '../components/RosterSection';
import { GroupSessionsSection } from '../components/GroupSessionsSection';

// ─── Header ──────────────────────────────────────────────────────────────────

function GroupHeader({ group, onEdit }: { group: GroupDetail; onEdit: () => void }) {
	const t = useAppT('groups');
	const tone = GROUP_STATUS_TONES[group.status];
	const schedule = formatScheduleRule(t, group.scheduleRule);

	return (
		<div className="rounded-xl border bg-card p-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<CalendarDays className="size-5" />
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-lg font-bold">{group.name}</h1>
							<StatusBadge tone={tone}>
								{t(`status.${group.status}`)}
							</StatusBadge>
						</div>
						<div className="mt-0.5 text-sm text-muted-foreground">
							{group.courseName}
							{schedule ? ` · ${schedule}` : ''}
						</div>
					</div>
				</div>

				<Can permission="group.update">
					<Button variant="outline" size="sm" onClick={onEdit}>
						<Edit className="mr-1.5 size-3.5" />
						{t('edit')}
					</Button>
				</Can>
			</div>

			<Separator className="my-4" />

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCard
					label={t('column.teacher')}
					value={group.defaultTeacherName ?? t('unassigned')}
					icon={<UserCog />}
					className="border"
				/>
				<StatCard
					label={t('column.room')}
					value={group.roomName ?? '—'}
					icon={<DoorOpen />}
					className="border"
				/>
				<StatCard
					label={t('detail.stat.enrolled')}
					value={
						group.capacity != null
							? `${group.activeEnrollmentsCount}/${group.capacity}`
							: group.activeEnrollmentsCount
					}
					icon={<Users />}
					className="border"
				/>
				<StatCard
					label={t('detail.stat.sessions')}
					value={group.sessionCount}
					icon={<CalendarClock />}
					className="border"
				/>
			</div>
		</div>
	);
}

// ─── Overview tab ────────────────────────────────────────────────────────────

function OverviewTab({ group }: { group: GroupDetail }) {
	const t = useAppT('groups');
	const schedule = formatScheduleRule(t, group.scheduleRule);
	return (
		<Card className="p-5">
			<DetailRows
				rows={[
					{
						label: t('column.course'),
						value: group.courseName,
						icon: <GraduationCap />,
					},
					{
						label: t('form.field.weeklySchedule'),
						value: schedule ?? t('notSet'),
						icon: <CalendarClock />,
					},
					{
						label: t('form.field.dateRange'),
						value:
							group.startDate && group.endDate
								? `${formatDate(group.startDate)} → ${formatDate(group.endDate)}`
								: t('notSet'),
						icon: <CalendarDays />,
					},
					{
						label: t('column.capacity'),
						value: group.capacity != null ? `${group.capacity} seats` : '—',
						icon: <Users />,
					},
				]}
			/>
		</Card>
	);
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface GroupDetailPageProps {
	groupId: number;
}

export function GroupDetailPage({ groupId }: GroupDetailPageProps) {
	const t = useAppT('groups');
	const navigate = useNavigate();
	const { data: group, isLoading, isError } = useGroup(groupId);

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-5">
			<Link
				to="/groups"
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				{t('back')}
			</Link>

			{isLoading ? (
				<div className="rounded-xl border bg-card p-5">
					<div className="flex items-center gap-4">
						<Skeleton className="size-12 rounded-xl" />
						<div className="flex flex-col gap-2">
							<Skeleton className="h-5 w-48" />
							<Skeleton className="h-4 w-64" />
						</div>
					</div>
				</div>
			) : isError || !group ? (
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					Group not found.
				</div>
			) : (
				<>
					<GroupHeader
						group={group}
						onEdit={() =>
							void navigate({
								to: '/groups/$groupId/edit',
								params: { groupId: String(group.id) },
							})
						}
					/>

					<Tabs defaultValue="roster" className="gap-4" variant="underline">
						<TabsList>
							<TabsTrigger value="roster">
								{t('detail.tab.roster')}
							</TabsTrigger>
							<TabsTrigger value="sessions">
								{t('detail.tab.sessions')}
							</TabsTrigger>
							<TabsTrigger value="overview">
								{t('detail.tab.overview')}
							</TabsTrigger>
						</TabsList>

						<TabsContent value="roster">
							<RosterSection groupId={group.id} capacity={group.capacity} />
						</TabsContent>
						<TabsContent value="sessions">
							<GroupSessionsSection groupId={group.id} />
						</TabsContent>
						<TabsContent value="overview">
							<OverviewTab group={group} />
						</TabsContent>
					</Tabs>
				</>
			)}
		</div>
	);
}
